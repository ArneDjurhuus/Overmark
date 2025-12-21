# Overmarksgården Intra

**Sammenværd, Tryghed, Udvikling**

En moderne intranet-applikation til §110 boformer, bygget med Next.js 14+, Tailwind CSS, Framer Motion og Supabase.

## ✨ Funktioner

- 🎨 **Glassmorphism Design**: Moderne UI med blur-effekter og gennemsigtighed
- 🎭 **Micro-interactions**: Flydende animationer med Framer Motion
- ⚡ **Realtime Updates**: Live dataopdateringer via Supabase Realtime
- 🔐 **RBAC**: Rolle-baseret adgangskontrol for beboere og personale
- 📱 **Accessibility**: 48px+ touch targets for optimal tilgængelighed
- 💀 **Skeleton Loaders**: Professionelle loading states
- 🇩🇰 **Dansk UI**: Al tekst på dansk

## 🚀 Kom i Gang

### Forudsætninger

- Node.js 18+
- En Supabase-konto og projekt

### Installation

1. Klon repositoriet:
```bash
git clone https://github.com/ArneDjurhuus/Overmark.git
cd Overmark
```

2. Installer dependencies:
```bash
npm install
```

3. Opsæt miljøvariabler:
```bash
cp .env.example .env.local
```

Rediger `.env.local` og tilføj dine Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=din-projekt-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
```

4. Kør udviklingsserveren:
```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

## 📁 Projektstruktur

```
src/
├── app/
│   ├── beboer/          # Beboer dashboard
│   ├── personale/       # Personale dashboard
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   └── globals.css      # Global styles
├── components/
│   ├── GlassCard.tsx    # Glassmorphism komponenter
│   └── Skeleton.tsx     # Loading states
├── utils/
│   └── supabase/        # Supabase klienter
├── types/
│   └── index.ts         # TypeScript typer
└── middleware.ts        # Route protection
```

## 🎯 Roller

### Beboer
- Se personlige aktiviteter
- Sende og modtage beskeder
- Opdatere profil

### Personale
- Administrere beboere
- Planlægge aktiviteter
- Se dashboard med statistik

## 🛠️ Teknologier

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Animationer**: Framer Motion
- **Backend**: Supabase (Auth, Database, Realtime)
- **Sprog**: TypeScript
- **UI Paradigme**: Glassmorphism

## 🔧 Scripts

- `npm run dev` - Start udviklingsserver
- `npm run build` - Byg til produktion
- `npm run start` - Start produktionsserver
- `npm run lint` - Kør ESLint

## 📝 Supabase Opsætning

For at bruge realtime funktioner skal du oprette følgende i din Supabase database:

```sql
-- Eksempel tabel til beskeder
create table messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable realtime
alter publication supabase_realtime add table messages;
```

## 🤝 Bidrag

Bidrag er velkomne! Åbn gerne en issue eller pull request.

## 📄 Licens

ISC
