# Map Marker

A full-stack real-time map pinning app. Drop a pin anywhere, upload a photo,
and watch it appear live on every connected device — instantly.

---

## Features

- Click anywhere on the map to place a pin
- Upload a photo with each report
- Pins appear live on all open tabs in real time
- Auto-centers on your GPS location
- All pins and photos persisted to a database

---

## Tech Stack

| Layer     | Technology                 |
| --------- | -------------------------- |
| Framework | Next.js 14 (App Router)    |
| Database  | Supabase (PostgreSQL)      |
| Realtime  | Supabase Realtime          |
| Storage   | Supabase Storage           |
| Map       | Leaflet.js + react-leaflet |
| Styling   | Tailwind CSS               |
| Language  | TypeScript                 |
| Hosting   | Vercel                     |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/renzifier/practice.git
cd practice
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Set up the database

Run this in the Supabase SQL Editor:

```sql
CREATE TABLE spots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat        FLOAT NOT NULL,
  lng        FLOAT NOT NULL,
  photo_url  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type       TEXT NOT NULL DEFAULT 'stray',
  description TEXT
);

ALTER TABLE spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read spots"
  ON spots FOR SELECT USING (true);

CREATE POLICY "anyone can insert spots"
  ON spots FOR INSERT WITH CHECK (true);

ALTER TABLE spots REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE spots;
```

### 5. Set up storage

Create a public bucket called `photos` in Supabase Storage, then run:

```sql
CREATE POLICY "allow all on photos"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'photos')
  WITH CHECK (bucket_id = 'photos');
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure
