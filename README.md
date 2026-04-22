# Vitaryo 🌿

Eine private PWA, die Layo sanft an ihre Vitamine erinnert. Gebaut mit Next.js 14, Prisma + Vercel Postgres, Web Push (VAPID) und Tailwind. Installierbar auf dem iPhone via „Zum Home-Bildschirm".

Vitaryo = **Vita**mine + **A**ry + La**yo** ❤

---

## Features

- Tagesliste mit Fortschritts-Bar, gruppiert in Morgens / Tagsüber / Abends
- Vitamin-CRUD: Name, Menge, Form (Kapsel, Tropfen, Spray …), Uhrzeit **oder** Tageszeit, Wiederholungs-Intervall (alle N Tage/Wochen/Monate), Vorwarnzeit für Push, Notiz, Emoji, Farbe
- Echte Web-Push-Erinnerungen pünktlich zur Einnahme (mit optionaler Lead-Time) – iOS-Lockscreen-fähig
- **Snooze-Button direkt in der Benachrichtigung** (+30 Min Erinnerung) und in der App
- Smarte Konflikt-Hinweise: warnt bei zu engem Abstand zwischen z.B. Eisen und Calcium
- Verlauf der letzten 7 / 14 / 30 Tage mit Mini-Progress-Bars
- Achievements / Trophäen: Streaks (3/7/14/30), Einnahme-Meilensteine (10/50/100/500), perfekte Wochen
- Offline-fähiger Service Worker, App-Icon + Favicon, kein Tracking

---

## Einmaliges Setup

### 1. Lokale Dateien in den GitHub-Repo pushen

Vorausgesetzt du hast Node 18+ und git installiert und `louftmkz/vitaryo` ist schon auf GitHub angelegt:

```bash
cd vitaryo
git init -b main
git add .
git commit -m "Initial Vitaryo PWA"
git remote add origin https://github.com/louftmkz/vitaryo.git
git push -u origin main
```

### 2. Vercel mit GitHub verbinden

1. Auf [vercel.com](https://vercel.com) mit GitHub einloggen.
2. Klick oben rechts **„Add New → Project"**.
3. `vitaryo` aus der Repo-Liste **Importieren**. Falls es fehlt: **„Adjust GitHub App Permissions"** klicken und den Repo freigeben.
4. Im Config-Screen: **Framework Preset: Next.js** sollte automatisch stehen. Root `./`. Noch **keine Env-Vars** eintragen.
5. **Deploy** klicken. Der erste Deploy schlägt fehl – das ist ok.

### 3. Postgres-DB anlegen

Im Vercel-Dashboard des Projekts → **Storage** → **Create Database → Postgres** (Region: Frankfurt empfohlen). Beim Erstellen **„Connect to Project"** → `vitaryo`. Das setzt `DATABASE_URL` automatisch.

### 4. VAPID-Keys generieren

Lokal im Terminal:

```bash
npx web-push generate-vapid-keys
```

Die zwei Keys im Vercel-Dashboard unter **Settings → Environment Variables** eintragen (alle drei Umgebungen aktivieren):

| Variable                         | Wert                                         |
|----------------------------------|----------------------------------------------|
| `VAPID_PUBLIC_KEY`               | Public Key aus dem Befehl                   |
| `VAPID_PRIVATE_KEY`              | Private Key aus dem Befehl                  |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`   | **nochmal** der Public Key                  |
| `VAPID_SUBJECT`                  | `mailto:lou.kailich@acture.de`              |
| `CRON_SECRET`                    | `openssl rand -hex 32` (beliebiger Secret)   |
| `APP_TIMEZONE`                   | `Europe/Berlin`                             |

### 5. Datenbank-Tabellen anlegen

Lokal: DATABASE_URL aus Vercel kopieren (Storage → deine DB → `.env.local` Tab → Copy Snippet) und in eine lokale `.env` packen. Dann:

```bash
npm install
npx prisma db push
```

Damit sind die Tabellen in der Vercel-Postgres-DB.

### 6. Redeploy

In Vercel: **Deployments** → letzter Deploy → `⋯` → **Redeploy**. Jetzt läuft die App auf `https://vitaryo.vercel.app`.

### 7. iPhone-Installation

1. Safari öffnen → `https://vitaryo.vercel.app`
2. Teilen-Icon (Quadrat mit Pfeil nach oben) → **„Zum Home-Bildschirm"**
3. **Aus dem Home-Screen-Icon** öffnen (nicht aus Safari)
4. In der App auf **🔔 Push-Erinnerungen aktivieren** tippen → Berechtigung erlauben
5. Ein **„Test-Push"**-Button erscheint, um zu prüfen, dass alles funktioniert

> **Wichtig:** Web Push auf iOS funktioniert **nur**, wenn die Seite als PWA installiert ist. Im Safari-Browser allein kommen keine Pushes.

---

## Lokal entwickeln

```bash
cp .env.example .env.local   # Werte eintragen
npm install
npx prisma db push
npm run dev
```

Auf `http://localhost:3000` – Push geht lokal nur, wenn HTTPS + valide VAPID-Keys gesetzt sind. Einfacher ist's, direkt auf der Vercel-Preview-URL zu testen.

---

## Cron (Push-Versand)

Vercel Cron feuert alle 5 Minuten `/api/cron/send-reminders` (konfiguriert in `vercel.json`). Die Route prüft, welche Intakes fällig sind (unter Berücksichtigung der Lead-Time) und schickt Pushes an alle registrierten Subscriptions.

> Das Free-Tier von Vercel erlaubt Cron nur einmal alle **24h**. Für engere Intervalle brauchst du den Pro-Plan ($20/Monat). Alternative: Externer Cron (cron-job.org), der alle 5 Min einen GET auf deine URL macht.

**Alternative ohne Pro-Plan:** Kostenloser Cron-Service wie [cron-job.org](https://cron-job.org) oder [easycron.com](https://www.easycron.com). Dort einen Job anlegen, der alle 5 Min `https://vitaryo.vercel.app/api/cron/send-reminders` mit Header `Authorization: Bearer <CRON_SECRET>` aufruft.

---

## Änderungen deployen

Einfach lokal ändern, `git commit && git push` – Vercel deployt automatisch in ~30 Sekunden.

---

## Dateien im Überblick

```
src/
  app/
    page.tsx                   Heute-Screen mit Checkliste
    settings/page.tsx          Vitamin-CRUD
    history/page.tsx           Verlauf 7/14/30 Tage
    achievements/page.tsx      Trophäen & Streaks
    api/
      vitamins/                CRUD
      intakes/today/           heutige Intakes
      intakes/[id]/taken/      abhaken
      intakes/[id]/snooze/     +30 Min
      push/subscribe/          Subscription speichern
      push/test/               Test-Push senden
      cron/send-reminders/     von Vercel Cron aufgerufen
      achievements/            Stats + Badges
      history/                 Verlaufsdaten
  components/
    IntakeCard.tsx             einzelne Einnahme
    ConflictHint.tsx           Abstands-Warnung
    PushPrompt.tsx             Push-aktivieren Banner
    BottomNav.tsx              Tab-Bar unten
    SWRegister.tsx             Service-Worker-Registration
  lib/
    db.ts                      Prisma-Client
    push.ts                    web-push Wrapper
    time.ts                    Zeitrechnungen, TZ, Intervalle
    conflicts.ts               Konflikt-Regeln
    achievements.ts            Streak/Meilenstein-Logik
    generate-intakes.ts        täglich Intakes erzeugen
prisma/schema.prisma           DB-Schema
public/
  logo.svg                     Master-Logo
  favicon.ico
  icons/                       PWA-Icons
  manifest.webmanifest         PWA-Manifest
  sw.js                        Service Worker
vercel.json                    Cron-Konfiguration
```

---

## Bekannte iOS-Eigenheiten

- Pushes kommen manchmal verzögert (Apple bündelt sie, besonders bei geschlossener App)
- Nach iOS-Update kann es vorkommen, dass die Push-Subscription erneuert werden muss – einfach in der App nochmal auf „Push aktivieren" tippen
- Actions in Notifications („Genommen" / „30 Min") funktionieren auf iOS ab iOS 16.4
- PWAs nutzen keine Haptics – ist Apple-seitig limitiert

Bei Problemen: **Einstellungen → Vitaryo → Hintergrundaktualisierung / Mitteilungen** prüfen.
