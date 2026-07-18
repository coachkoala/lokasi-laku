/**
 * Claude API wrapper untuk generate insights tentang gap bisnis
 * Menggunakan Anthropic SDK
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface POIAggregateData {
  [category: string]: {
    count: number;
    avgRating: number;
    places: Array<{
      name: string;
      rating: number;
      reviewCount: number;
    }>;
  };
}

interface GapAnalysisResult {
  category: string;
  score: "hot" | "medium" | "low";
  title: string;
  description: string;
  competitors: number;
  avgRating: number;
}

/**
 * Generate prompt untuk analisis gap bisnis
 */
function generateGapAnalysisPrompt(
  aggregatedPOIs: POIAggregateData,
  location: string,
  radius: number
): string {
  const categoryList = Object.entries(aggregatedPOIs)
    .map(
      ([cat, data]) =>
        `- ${cat}: ${data.count} bisnis, rating rata-rata ${data.avgRating}`
    )
    .join("\n");

  return `Anda adalah analis bisnis lokal yang berpengalaman di Indonesia. Saya punya data tentang bisnis/usaha yang ada di dekat lokasi "${location}" (radius ${radius}m).

Data POI yang terdaftar:
${categoryList}

Berdasarkan data ini, identifikasi 3-5 kategori bisnis yang PALING POTENSIAL untuk dibuka di lokasi ini. Fokus pada GAP (kategori yang kurang supply tapi punya demand tinggi).

Untuk setiap rekomendasi, berikan:
1. Nama kategori bisnis
2. Tingkat peluang (Peluang tinggi / Cukup potensial / Sudah jenuh)
3. Penjelasan mengapa kategori ini potensial (1 kalimat singkat, berbasis data)
4. Jumlah kompetitor langsung saat ini
5. Rating rata-rata kompetitor (kalau ada)

Format output HARUS JSON array dengan struktur:
[
  {
    "category": "Laundry kiloan",
    "score": "Peluang tinggi",
    "description": "Hanya ada 1 laundry sementara ada 12 kos-kosan di radius ini",
    "competitors": 1,
    "avgRating": 3.2
  },
  ...
]

Hanya output JSON, tanpa penjelasan tambahan.`;
}

/**
 * Call Claude API untuk analyze gap bisnis (Mode "Temukan Peluang")
 */
export async function analyzeBusinessGaps(
  aggregatedPOIs: POIAggregateData,
  location: string,
  radius: number
): Promise<GapAnalysisResult[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const prompt = generateGapAnalysisPrompt(aggregatedPOIs, location, radius);

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Claude response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Map to our format with score type
    const results: GapAnalysisResult[] = parsed.map((item: any) => ({
      category: item.category,
      score: mapScoreToType(item.score),
      title: item.score,
      description: item.description,
      competitors: item.competitors,
      avgRating: item.avgRating || null,
    }));

    return results;
  } catch (error) {
    console.error("Error calling Claude API:", error);
    throw error;
  }
}

/**
 * Map Vietnamese/Indonesian score labels to score type
 */
function mapScoreToType(score: string): "hot" | "medium" | "low" {
  const lower = score.toLowerCase();
  if (lower.includes("tinggi") || lower.includes("high")) return "hot";
  if (lower.includes("jenuh") || lower.includes("saturated")) return "low";
  return "medium";
}

/**
 * Generate narrative insight (untuk display yang lebih detailed)
 */
export async function generateNarrativeInsight(
  location: string,
  radius: number,
  topRecommendation: GapAnalysisResult
): Promise<string> {
  const prompt = `Buatkan 2-3 kalimat insight naratif tentang peluang bisnis "${topRecommendation.category}" di "${location}" (radius ${radius}m).

Insight harus:
- Jelas & actionable
- Berbasis data (jangan spekulasi)
- Bahasa friendly (bukan formal corporate)
- Fokus pada "why" (mengapa kategori ini potensial)

Hanya output narrative text, tanpa penjelasan tambahan.`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    return content.text.trim();
  } catch (error) {
    console.error("Error generating narrative:", error);
    return `Peluang potensial untuk ${topRecommendation.category} berdasarkan data lokasi.`;
  }
}
