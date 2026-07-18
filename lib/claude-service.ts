/**
 * Claude API wrapper untuk generate verdict kelayakan satu ide usaha di satu lokasi
 */

import Anthropic from "@anthropic-ai/sdk";
import { CategoryRadiusRange, CompetitorInfo } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ValidationVerdict {
  verdict: "good" | "risky" | "unknown";
  title: string;
  description: string;
}

function generateValidationPrompt(
  category: string,
  competitors: CompetitorInfo[],
  radius: number,
  radiusGuidance: CategoryRadiusRange | null
): string {
  const competitorLines = competitors
    .slice(0, 15)
    .map((c) => `- ${c.name} — ${c.distance}m, rating ${c.rating ?? "-"}`)
    .join("\n");

  const radiusNote = radiusGuidance
    ? `Kategori ini biasanya punya radius wajar ${radiusGuidance.min}-${radiusGuidance.max}m (jarak yang orang biasa mau tempuh untuk kategori sejenis).`
    : `Kategori ini tidak ada di daftar referensi radius wajar kami — nilai kewajaran radius secara umum berdasarkan jenis usahanya.`;

  return `Anda adalah analis lokasi bisnis senior yang mengevaluasi kelayakan SATU ide usaha spesifik di Indonesia. User ingin membuka usaha kategori "${category}", radius pencarian ${radius}m.

=== DATA KOMPETITOR (hasil scan Google Places) ===
Jumlah kompetitor ditemukan dalam radius: ${competitors.length}
${competitorLines || "(tidak ada kompetitor ditemukan dalam radius)"}

${radiusNote}

=== METODE BERPIKIR (WAJIB diikuti sebelum menjawab) ===

LANGKAH 1 — Analisa kompetisi (metode undersupply-gap / quality-gap)
- Kompetitor sedikit (0-3) → verdict "good", kompetisi rendah = peluang tinggi. Kalau kategori "${category}" terdengar seperti usaha niche/rumahan yang biasanya kurang lengkap terdaftar di Google Maps (katering rumahan, jasa jahit, toko pulsa, dsb), sebutkan di description sebagai KONTEKS TAMBAHAN yang memperkuat peluang ("kemungkinan kompetitor riil lebih sedikit dari yang tercatat, karena banyak usaha sejenis tidak terdaftar lengkap") — bukan sebagai alasan ragu-ragu. Tetap komit ke verdict "good".
- Kompetitor lumayan banyak TAPI rating rata-rata rendah (di bawah ±3.8) → verdict "good", ada window masuk dengan kualitas lebih baik dari incumbent yang lemah.
- Kompetitor banyak DAN rating rata-rata tinggi (4.2+) → verdict "risky", incumbent kuat, area sudah cukup ramai untuk kategori ini.
- Kondisi di tengah-tengah → gunakan judgment, boleh "good" dengan catatan hati-hati atau "risky" ringan, jelaskan alasannya di description.
- Verdict "unknown" HANYA untuk kasus benar-benar tanpa sinyal apapun (0 kompetitor DAN radius pencarian sudah maksimal/luas) — kalau ada minimal 1 kompetitor untuk dianalisa, tetap putuskan "good" atau "risky", jangan lari ke "unknown".

LANGKAH 2 — Cek relevansi radius
Kalau mayoritas kompetitor yang ketemu jaraknya dekat ke batas radius pencarian (jauh dari titik pusat) dibanding radius wajar kategori ini, sebutkan bahwa kompetisi di jarak dekat sebenarnya mungkin lebih rendah dari angka total — beri konteks jujur.

LANGKAH 3 — Tulis verdict
"title": kalimat pendek tegas (contoh: "Peluang tinggi, kompetisi rendah" / "Area sudah cukup ramai untuk kategori ini").
"description": 2-3 kalimat, WAJIB sebut angka konkret (jumlah kompetitor, rating, jarak terdekat) dan alasan jelas, bahasa natural bukan formal korporat. JANGAN mengarang angka di luar data yang diberikan.

Output hasil akhir sebagai JSON (boleh didahului reasoning singkat, JSON harus ada di bagian akhir jawaban):
{
  "verdict": "good",
  "title": "...",
  "description": "..."
}`;
}

/**
 * Call Claude API untuk generate verdict kelayakan 1 kategori usaha di 1 lokasi.
 * Angka statistik yang ditampilkan ke user (competitorCount, avgRating, dsb)
 * dihitung di route handler dari data Places API asli, bukan dari sini —
 * Claude hanya bertanggung jawab atas judgment verdict & narasi.
 */
export async function generateValidationVerdict(
  category: string,
  competitors: CompetitorInfo[],
  radius: number,
  radiusGuidance: CategoryRadiusRange | null
): Promise<ValidationVerdict> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY belum dikonfigurasi");
  }

  const prompt = generateValidationPrompt(category, competitors, radius, radiusGuidance);

  const response = await client.messages.create({
    model: "claude-opus-4-1",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Format respons Claude tidak dikenali");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Gagal parse JSON dari respons Claude");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const verdict: ValidationVerdict["verdict"] =
    parsed.verdict === "good" || parsed.verdict === "risky" ? parsed.verdict : "unknown";

  return {
    verdict,
    title: parsed.title || "",
    description: parsed.description || "",
  };
}
