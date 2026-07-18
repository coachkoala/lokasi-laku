# LokasiLaku — Analisa Potensi Bisnis di Lokasi Manapun

Aplikasi web yang menganalisa peluang bisnis di suatu lokasi. Tandai titik di peta atau masukkan alamat, dan AI akan merekomendasikan kategori bisnis apa yang paling potensial berdasarkan gap (rasio kebutuhan vs ketersediaan).

**Target users**: UMKM & individu di Indonesia yang ingin membuka usaha kecil-menengah, mulai dari Bandung sebagai MVP.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- Google Cloud account dengan Places API (Nearby Search + Place Details enabled)
- Anthropic API key (Claude)

### Setup

1. **Clone / Navigate ke project**:
   ```bash
   cd "D:\Claude\lokasi-laku"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local dengan API keys Anda:
   # NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
   # GOOGLE_PLACES_API_KEY=...
   # ANTHROPIC_API_KEY=...
   ```

4. **Start dev server**:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di browser.

---

## 📋 Project Structure

```
lokasi-laku/
├── app/
│   ├── layout.tsx              # Root layout with fonts
│   ├── page.tsx                # Main app (state + logic)
│   ├── globals.css             # Design system & tokens
│   └── api/
│       └── analyze/
│           └── route.ts        # Backend API endpoint
├── components/
│   ├── Sidebar.tsx             # Left panel (search, radius, cards)
│   ├── RecommendationCard.tsx  # Individual recommendation
│   ├── MapArea.tsx             # Right panel (map visual)
│   └── icons/
│       └── SearchIcon.tsx
├── styles/
│   ├── app.css                 # Sidebar styling
│   └── map.css                 # Map & markers styling
├── types/
│   └── index.ts                # TypeScript interfaces & constants
├── lib/                        # (To be created)
│   ├── places-service.ts       # Google Places API wrapper
│   ├── claude-service.ts       # Claude API wrapper
│   └── cache.ts                # In-memory cache
├── public/                     # Static assets (to be created)
├── .env.example                # API key template
├── .env.local                  # (Your actual keys - git ignored)
├── package.json
├── tsconfig.json
└── next.config.js
```

---

## 🎨 Design System

Tema "night market" dengan palet:
- **Market Green** (#1c3329) — Background utama
- **Ochre** (#e8ad4d) — Aksen utama (highlights, toggle aktif)
- **Coral** (#e07257) — Urgensi, gap, CTA
- **Teal** (#5a9385) — Kompetitor padat, secondary
- **Typography**: Space Grotesk (headings), Inter (body), IBM Plex Mono (data)

---

## 📊 Features - MVP v0

### ✅ Mode "Temukan Peluang" (Discovery)
- User input: lokasi + radius
- Output: ranking 3-5 kategori bisnis dengan insight naratif
- Radius contextual per kategori (bukan fixed)
- Visual: sidebar recommendations + map POI markers

### 🔄 Mode "Validasi Ide" (Coming soon)
- User input: lokasi + kategori bisnis spesifik
- Output: verdict (peluang tinggi / potensial / jenuh)
- Detail: kompetitor list, harga range, jarak terdekat

---

## 🔌 API Integration (Phases 2-3)

### Google Places API
- **Endpoint**: Nearby Search + Place Details
- **Use**: Fetch POIs (bisnis) dalam radius dari lokasi user
- **Field masking**: Minimize quota usage (ambil hanya: name, rating, address, kategori)
- **Caching**: Hasil di-cache per `{lat,lng,radius}` untuk avoid repeated calls

### Claude API
- **Input**: Aggregated POI data (counts per kategori, avg ratings, density patterns)
- **Processing**: AI reasoning untuk identify gaps & rank opportunities
- **Output**: Structured recommendation list dengan narrative insights

---

## 📱 Responsive Design

- **Desktop** (900px+): Sidebar 380px + Map full width
- **Tablet/Mobile** (<900px): Stacked layout (sidebar above map)

---

## 🧪 Testing Checklist (Phase 1)

- [ ] `npm install` berhasil
- [ ] `npm run dev` starts on localhost:3000
- [ ] Sidebar renders dengan benar (logo, search, radius, mode toggle)
- [ ] Map area shows grid + center pin + sample markers
- [ ] Recommendation cards clickable (visual feedback)
- [ ] Radius slider updates nilai & circle size
- [ ] Mode toggle switches between Discover ↔ Validate panels

---

## 🚀 Deployment

Built for **Vercel** (Next.js native):
```bash
npm run build
# Deploy to Vercel or other Next.js host
```

---

## 📝 Tech Stack

- **Frontend**: React 18 + Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Custom CSS (no Tailwind — matches design exactly)
- **APIs**: Google Places (New), Claude API
- **State**: React hooks (useState for MVP)

---

## 📚 References

- Spec detail: See `lokasilaku-spec.md` (in repo root or chat history)
- Mockup reference: `lokasilaku-app-v4.html` (visual + interaction patterns)
- Implementation plan: `.claude/plans/floofy-scribbling-nova.md`

---

## 🤝 Contributing

Kontribusi welcome! Follow commit conventions:
- `feat: add geocoding integration`
- `fix: radius circle not updating`
- `refactor: extract POI filtering logic`

---

## 📄 License

TBD — Project in early MVP phase.
