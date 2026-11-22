# Japi 🐾

Die Familien-App für Japi: Wer hat schon gefüttert, wer war Gassi? Live auf allen Handys der Familie.
PWA (React + Vite + TypeScript + Tailwind), Hosting auf Vercel, Daten in Supabase. Kosten: 0 €.

> **Komplett getrennt von Nexus.** Eigenes GitHub-Repo, eigenes Supabase-Projekt, eigenes Vercel-Projekt.
> Hier stehen nie Werte aus Nexus drin, und Nexus wird nirgends angefasst.

## Einrichtung (einmalig, ca. 15 Minuten)

### 1. Supabase-Projekt anlegen
1. Auf [supabase.com/dashboard](https://supabase.com/dashboard) oben links auf den Organisations-Namen klicken
   → **New organization** → Name `Japi`, Plan **Free**.
   *Warum eine eigene Organisation?* So taucht Japi nicht zwischen den Nexus-Projekten auf, und falls die
   Nexus-Organisation einen bezahlten Plan hat, kostet ein Projekt dort extra. In der Free-Organisation kostet es nichts.
2. In der neuen Organisation **New project** → Name `japi-orga`, Region **Frankfurt (eu-central-1)**,
   ein Datenbank-Passwort erzeugen lassen (brauchst du nicht weiter).
3. **Authentication → Sign In / Providers** → **Allow anonymous sign-ins** einschalten → Speichern.
4. **SQL Editor** → **New query** → den ganzen Inhalt von
   [`supabase/migrations/0001_family.sql`](supabase/migrations/0001_family.sql) einfügen → **Run**.
   Es sollte „Success" erscheinen. Danach genauso `0002_grants.sql` und `0003_checklist.sql`
   (immer der Reihe nach, jede Datei nur einmal).
5. **Project Settings → API** (bzw. **Data API / API Keys**): die **Project URL** und den
   **anon / publishable key** kopieren. Den *service_role / secret key* niemals verwenden.

### 2. Vercel-Projekt anlegen
1. Auf [vercel.com/new](https://vercel.com/new) das Repo **japi-orga** importieren
   (Framework wird automatisch als *Vite* erkannt).
2. Unter **Environment Variables** eintragen (Werte aus Schritt 1.5, nur aus dem Japi-Projekt):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Deploy**. Die App läuft dann unter `https://japi-orga.vercel.app` (oder ähnlich).
   Bitte **keine** Domain von Nexus verbinden.

### 3. Familie einrichten
1. Auf deinem Handy die Vercel-Adresse öffnen.
   - **iPhone:** in Safari → Teilen → „Zum Home-Bildschirm". Danach nur noch über das Symbol öffnen.
   - **Android:** in Chrome → ⋮ → „App installieren".
2. **Neue Familie gründen** → Namen + Emoji wählen → es erscheint ein QR-Code.
3. Die anderen scannen den QR-Code mit der Kamera (oder geben den 6-stelligen Code ein) und wählen Namen + Emoji.

## Entwickeln

```bash
cp .env.example .env   # Werte vom Japi-Supabase-Projekt eintragen
npm install
npm run dev
```

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `src/lib/session.tsx` | Anonyme Anmeldung, Familie gründen/beitreten, Live-Mitgliederliste |
| `src/screens/` | Willkommen, Gründen, Beitreten (Code oder QR-Link `/j/CODE`), Startseite, Einladen, Profil |
| `supabase/migrations/` | Datenbank-Schema mit Row Level Security: jede Familie sieht nur sich selbst |

## Fahrplan
1. ✅ Grundgerüst + Familien-Login
2. ✅ Live-Checkliste + Verlauf (Futter, Gassi, Spielen, eigene Aufgaben, Doppelt-Füttern-Warnung, 10 s Rückgängig)
3. NFC-Sticker (Kühlschrank = Futter, Flur = Gassi) mit Gedrückt-halten-Bestätigung
4. Push-Erinnerungen (pg_cron + Edge Function, Web Push)
5. Extras
