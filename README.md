# Sveriges Radio MCP Server

[![Server Status](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fsverigesradio-mcp.onrender.com%2Fhealth&query=%24.status&label=Server&color=brightgreen)](https://sverigesradio-mcp.onrender.com/health)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![Protocol](https://img.shields.io/badge/MCP-2025--03--26-green)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

**MCP-server for Sveriges Radio's Open API - access Swedish public radio programs, podcasts, live streams, playlists, news and traffic information.**

*MCP-server for Sveriges Radios Öppna API - tillgång till svensk public service-radio: program, podcasts, liveströmmar, spellistor, nyheter och trafikinformation.*

---

## Översikt

| Kategori | Antal | Beskrivning |
|----------|-------|-------------|
| **Tools** | 26 | Program, kanaler, avsnitt, spellistor, nyheter, trafik |
| **Resources** | 4 | API-info, kanallista, ljudkvalitet, kategorier |
| **Prompts** | 6 | Fördefinierade arbetsflöden för vanliga uppgifter |

---

## Snabbstart

### Alternativ 1: Remote Server (Rekommenderat)

**Ingen installation krävs!** Använd vår hostade server direkt.

<details>
<summary><strong>ChatGPT</strong></summary>

1. Gå till **Settings** → **Connected Apps** → **Add Plugin**
2. Välj "Add custom MCP server"
3. Ange URL: `https://sverigesradio-mcp.onrender.com/mcp`

</details>

<details>
<summary><strong>Claude Desktop / Claude Code</strong></summary>

Lägg till i din MCP-konfiguration (`claude_desktop_config.json` eller `.claude.json`):

```json
{
  "mcpServers": {
    "sverigesradio": {
      "url": "https://sverigesradio-mcp.onrender.com/mcp"
    }
  }
}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

Lägg till i `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "sverigesradio": {
      "transportType": "streamable-http",
      "url": "https://sverigesradio-mcp.onrender.com/mcp"
    }
  }
}
```

</details>

<details>
<summary><strong>Andra MCP-klienter</strong></summary>

Använd **StreamableHTTP transport** (MCP 2025-03-26 spec):
- **Endpoint:** `https://sverigesradio-mcp.onrender.com/mcp`
- **Auth:** Ingen (publikt API)
- **Format:** JSON-RPC 2.0

</details>

---

### Alternativ 2: npm-paket

```bash
npx sverigesradio-mcp
```

Eller installera globalt:

```bash
npm install -g sverigesradio-mcp
sverigesradio-mcp
```

---

### Alternativ 3: Lokal Installation

```bash
git clone https://github.com/isakskogstad/Sveriges.Radio-MCP.git
cd Sveriges.Radio-MCP
npm install
npm run build
npm start
```

<details>
<summary><strong>Lägg till i Claude Code</strong></summary>

```bash
claude mcp add sverigesradio node /path/to/Sveriges.Radio-MCP/dist/index.js
```

</details>

---

## Vad kan du göra? (26 tools)

När du kopplat MCP-servern till din AI-assistent kan du ställa frågor på naturligt språk. Här är alla funktioner med exempel:

<details open>
<summary><strong>🎙️ Realtid & Live</strong></summary>

**Fråga AI:n:**
> *"Ge mig en morgonöversikt - vad sänds just nu på P1, P3 och P4"*
>
> *"Vilka program sänds live just nu?"*

| Tool | Vad den gör |
|------|-------------|
| `get_all_rightnow` | Vad som spelas på ALLA kanaler just nu |
| `get_channel_rightnow` | Aktuellt program på en specifik kanal |
| `get_playlist_rightnow` | Aktuell låt (föregående, nuvarande, nästa) |

</details>

<details>
<summary><strong>🎵 Musik & Spellistor</strong></summary>

**Fråga AI:n:**
> *"Vilken låt spelades på P3 för ungefär 20 minuter sedan?"*
>
> *"Visa de senaste 10 låtarna som spelats på P2 Musik"*
>
> *"Vilka artister spelas mest på P4?"*

| Tool | Vad den gör |
|------|-------------|
| `get_playlist_rightnow` | Låt som spelas just nu |
| `get_channel_playlist` | Låthistorik för en kanal inom tidsintervall |
| `get_program_playlist` | Låthistorik för ett program |
| `get_episode_playlist` | Komplett spellista för ett avsnitt |

*Alla låtar inkluderar: titel, artist, kompositör, album, skivbolag, producent, textförfattare och tidsstämplar*

</details>

<details>
<summary><strong>🎧 Program & Podcasts</strong></summary>

**Fråga AI:n:**
> *"Jag gillar true crime och dokumentärer. Vilka SR-podcasts passar mig?"*
>
> *"Finns det några bra podcasts om svensk historia?"*
>
> *"Rekommendera en podd för min 45-minuters pendling"*

| Tool | Vad den gör |
|------|-------------|
| `search_programs` | Sök efter program (med relevansranking) |
| `get_program` | Hämta programdetaljer |
| `list_program_categories` | Alla 15 programkategorier |
| `get_program_schedule` | När ett program sänds |
| `list_broadcasts` | Tillgängliga sändningar (30 dagar) |
| `list_podfiles` | Podcastfiler för ett program |
| `get_podfile` | Specifik podcastfil med metadata |

</details>

<details>
<summary><strong>📺 Avsnitt</strong></summary>

**Fråga AI:n:**
> *"Hitta alla avsnitt av Vetenskapsradion som handlar om AI"*
>
> *"Vad handlade senaste avsnittet av Konflikt om?"*

| Tool | Vad den gör |
|------|-------------|
| `list_episodes` | Lista avsnitt från ett program |
| `search_episodes` | Fulltextsökning i avsnitt |
| `get_episode` | Specifikt avsnitt med ljudfiler |
| `get_episodes_batch` | Hämta flera avsnitt samtidigt |
| `get_latest_episode` | Senaste avsnittet för ett program |

</details>

<details>
<summary><strong>📻 Kanaler & Schema</strong></summary>

**Fråga AI:n:**
> *"Lista SR:s alla lokalradiostationer"*
>
> *"Vad går på P1 ikväll mellan 18-21?"*
>
> *"När sänds nästa avsnitt av Filosofiska rummet?"*

| Tool | Vad den gör |
|------|-------------|
| `list_channels` | Alla kanaler (P1-P4, lokalstationer) |
| `get_channel_schedule` | Tablå för en kanal och datum |
| `get_program_broadcasts` | Kommande sändningar för ett program |

</details>

<details>
<summary><strong>📰 Nyheter</strong></summary>

**Fråga AI:n:**
> *"Sammanfatta de senaste nyheterna från Ekot"*
>
> *"Vad har hänt i Sverige idag enligt SR?"*

| Tool | Vad den gör |
|------|-------------|
| `list_news_programs` | Översikt av nyhetsprogram |
| `get_latest_news_episodes` | Senaste nyhetssändningar |

</details>

<details>
<summary><strong>🚗 Trafik</strong></summary>

**Fråga AI:n:**
> *"Finns det några trafikproblem på E4:an just nu?"*
>
> *"Hur är trafikläget i Stockholm?"*

| Tool | Vad den gör |
|------|-------------|
| `get_traffic_messages` | Trafikmeddelanden per område |
| `get_traffic_areas` | Trafikområden (med GPS-uppslag) |

</details>

<details>
<summary><strong>🔍 Övrigt</strong></summary>

**Fråga AI:n:**
> *"Sök efter allt som handlar om klimatet"*
>
> *"Vilka programkategorier finns det på Sveriges Radio?"*

| Tool | Vad den gör |
|------|-------------|
| `search_all` | Global sökning (program + avsnitt + kanaler) |
| `get_recently_published` | Nyligen publicerat innehåll |
| `get_top_stories` | Utvalt innehåll från SR |
| `list_extra_broadcasts` | Extra sändningar (sport, special events) |
| `get_episode_group` | Samling av avsnitt |

</details>

---

## Bygg egna appar

Med MCP-servern som backend kan du snabbt bygga användbara verktyg. Här är fyra idéer:

### 1. Personlig Radio-Dashboard

En webbsida som visar allt du behöver på morgonen - live-radio, nyheter och trafikinfo.

<img src="docs/images/1-dashboard.png" alt="Radio Dashboard mockup" width="400">

**Tools:** `get_all_rightnow` + `get_latest_news_episodes` + `get_traffic_messages`

---

### 2. "Vad var det för låt?" - Musikidentifierare

En app för att hitta låtar du hört på radion, med Spotify-integration.

<img src="docs/images/2-music.png" alt="Music identifier mockup" width="400">

**Tools:** `get_playlist_rightnow` + `get_channel_playlist`

---

### 3. Podcast-rekommendationsmotor

En smart sökmotor som hittar rätt podd baserat på dina intressen.

<img src="docs/images/3-podcast.png" alt="Podcast finder mockup" width="400">

**Tools:** `search_programs` + `list_program_categories` + `get_latest_episode`

---

### 4. Trafikvarnings-bot (Slack/Discord)

En bot som automatiskt varnar ditt team om trafikproblem på pendlingsvägarna.

<img src="docs/images/4-traffic.png" alt="Traffic bot mockup" width="400">

**Tools:** `get_traffic_messages` + `get_traffic_areas` (polling var 5:e minut)

---

### Kombinera med andra verktyg

MCP-servern blir ännu kraftfullare tillsammans med andra AI-verktyg:

| Kombination | Exempel |
|-------------|---------|
| **+ Kalender** | "Lägg till Konflikt i min kalender när det sänds" |
| **+ Webbsökning** | "Sök mer info om artisten som spelas på P3 just nu" |
| **+ Anteckningar** | "Spara länken till senaste P3 Dokumentär i mina anteckningar" |
| **+ Översättning** | "Översätt programbeskrivningen till engelska" |

---

## Teknisk Stack

| Komponent | Teknologi |
|-----------|-----------|
| **Runtime** | Node.js 20+ |
| **Språk** | TypeScript 5.6 |
| **MCP SDK** | @modelcontextprotocol/sdk |
| **Transport** | StreamableHTTP (MCP 2025-03-26) |
| **API** | Sveriges Radio Open API v2 |
| **Hosting** | Render (Frankfurt) |

### Säkerhetsfunktioner

| Funktion | Beskrivning |
|----------|-------------|
| **Session TTL** | Automatisk rensning av inaktiva sessioner (30 min) |
| **Rate Limiting** | Konfigurerbar per-IP begränsning (60 req/min) |
| **UUID Validering** | Säker session ID-validering |
| **CORS** | Konfigurerbara tillåtna origins |
| **Strukturerad Loggning** | JSON-formaterade loggar för övervakning |

---

## Konfiguration

| Variabel | Standard | Beskrivning |
|----------|----------|-------------|
| `PORT` | `3000` | HTTP-serverport |
| `MCP_AUTH_TOKEN` | - | Valfri Bearer-token för autentisering |
| `ALLOWED_ORIGINS` | `*` | CORS origins (kommaseparerade eller * för alla) |
| `SESSION_TTL_MS` | `1800000` | Session timeout (30 min standard) |
| `RATE_LIMIT_REQUESTS` | `60` | Max requests per minut per IP |

---

## Utveckling

```bash
npm run dev          # Utvecklingsläge (stdio)
npm run dev:http     # HTTP-server utveckling
npm run build        # Bygg för produktion
npm test             # Kör tester
```

---

## Licens

MIT (c) Isak Skogstad

---

## Länkar

- [GitHub Repository](https://github.com/isakskogstad/Sveriges.Radio-MCP)
- [SR API Dokumentation](https://api.sr.se/api/documentation/v2/)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Changelog](CHANGELOG.md)

---

## Support

Skapa ett [GitHub Issue](https://github.com/isakskogstad/Sveriges.Radio-MCP/issues) för bugrapporter eller funktionsförfrågningar.
