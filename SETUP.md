# Setup Guide - LokasiLaku MVP

## 1️⃣ Initial Setup (5 menit)

### Install Dependencies
```bash
cd D:\Claude\lokasi-laku
npm install
```

Ini akan install:
- `next` (14.0.0)
- `react` + `react-dom` (18.2.0)
- `@anthropic-ai/sdk` (Claude API client)
- `axios` (HTTP client)
- TypeScript + dev dependencies

### Konfigurasi Environment Variables
```bash
# Copy template
cp .env.example .env.local

# Edit .env.local dengan API keys Anda:
```

**Required for Phase 2-3**:
- `GOOGLE_PLACES_API_KEY` — dari Google Cloud Console
- `ANTHROPIC_API_KEY` — dari Anthropic Console

**For now** (Phase 1 - UI testing), bisa kosong dulu.

---

## 2️⃣ Run Dev Server

```bash
npm run dev
```

Harusnya output:
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

Buka browser → `http://localhost:3000`

---

## 3️⃣ What You Should See (Phase 1 ✅)

**Layout**:
- Left sidebar (380px): Logo "LokasiLaku", search box, radius slider, mode toggle (Temukan Peluang / Validasi Ide)
- Right map area: Grid background + center ochre pin + sample POI markers

**Interactivity**:
- ✅ Radius slider: updates value label + circle size on map
- ✅ Recommendation cards: clickable, highlight on selection
- ✅ Mode toggle: switches between sidebar panels
- ✅ Search box: type-able (not wired to geocoding yet)

**Design**:
- ✅ Night market green background
- ✅ Ochre accents (logo dot, active button, highlights)
- ✅ Coral for emphasis (pin, hot score badge, urgent markers)
- ✅ Smooth animations & shadows

---

## 4️⃣ Project Structure Explained

```
app/
├── page.tsx              ← Main app component (React state + logic)
├── layout.tsx            ← Root layout (fonts, metadata)
├── globals.css           ← Design tokens (colors, shadows, animations)
└── api/
    └── analyze/
        └── route.ts      ← Backend endpoint for analysis (placeholder)

components/
├── Sidebar.tsx           ← Left panel (location input, recommendations)
├── MapArea.tsx           ← Right panel (visual map)
└── icons/
    └── SearchIcon.tsx    ← SVG icon

lib/
├── cache.ts              ← In-memory caching layer
├── places-service.ts     ← Google Places API wrapper (not wired yet)
└── claude-service.ts     ← Claude API wrapper (not wired yet)

styles/
├── app.css               ← Sidebar, buttons, cards styling
└── map.css               ← Map area, markers, legend styling

types/
└── index.ts              ← TypeScript interfaces & constants
```

---

## 5️⃣ Next Steps (Phase 2-3)

### Option A: Continue with Geocoding (Recommended)
1. Implement address → coordinates translation
   - File: `components/Sidebar.tsx` method `handleSearchSubmit()`
   - Use Google Geocoding API or Places Autocomplete
2. Wire up `/api/analyze` endpoint
3. Test with real Bandung locations

### Option B: Setup API Keys & Test Backend
1. Get Google Cloud API keys (Places API, Geocoding API)
2. Get Anthropic API key
3. Populate `.env.local`
4. Implement `/api/analyze` full logic (Places → aggregation → Claude → response)

### Option C: UI Polish
1. Add loading spinners during API calls
2. Add error message display
3. Implement responsive design for mobile
4. Refine micro-interactions (hover effects, card transitions)

---

## 🧪 Quick Testing

### Test 1: UI Layout
```bash
npm run dev
# Check browser at http://localhost:3000
# Inspect: sidebar visible, map area visible, no console errors
```

### Test 2: TypeScript
```bash
npm run type-check
# Should pass with no errors
```

### Test 3: Build
```bash
npm run build
# Should complete successfully
```

---

## 🔧 Troubleshooting

### Port 3000 already in use?
```bash
npm run dev -- -p 3001
# Or kill the process: lsof -i :3000 | grep node | awk '{print $2}' | xargs kill -9
```

### Fonts not loading?
- Fonts loaded from Google Fonts API (check network tab in browser DevTools)
- May take 1-2 sec on first load

### Styling looks off?
- Clear browser cache: Ctrl+Shift+R (hard refresh)
- Check that `.css` files are correctly imported in `app/page.tsx`

### ESLint warnings?
- Run: `npm run lint -- --fix` to auto-fix

---

## 📚 File Modifications Ready

These are the files that will need updates in Phase 2-3:

| File | Phase | Change | Status |
|------|-------|--------|--------|
| `components/Sidebar.tsx` | 2 | Wire geocoding + radius guardrails | 🟡 Pending |
| `app/api/analyze/route.ts` | 2-3 | Implement full analysis logic | 🟡 Pending |
| `app/page.tsx` | 2 | Connect API calls | 🟡 Pending |
| `.env.local` | 2 | Add API keys | 🔴 Requires User Action |

---

## ✅ Success Criteria (Phase 1 Complete)

- [ ] `npm install` finishes without errors
- [ ] `npm run dev` starts on localhost:3000
- [ ] All components render without console errors
- [ ] Sidebar + Map Area both visible and responsive
- [ ] Radius slider works (updates display)
- [ ] Recommendation cards render sample data
- [ ] Mode toggle switches panels
- [ ] CSS matches night market design theme

---

## 💬 Questions?

Refer to:
- `README.md` — Project overview
- `lokasilaku-spec.md` — Full specification & MVP scope
- `lokasilaku-app-v4.html` — Visual reference mockup
- `.claude/plans/floofy-scribbling-nova.md` — Implementation plan

---

Ready to start? Run `npm install` and report back! 🚀
