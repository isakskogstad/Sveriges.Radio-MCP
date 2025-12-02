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

## Tillgängliga Tools

<details>
<summary><strong>Realtid & Live (3 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `get_all_rightnow` | Vad som spelas på ALLA kanaler just nu |
| `get_channel_rightnow` | Aktuellt program på en specifik kanal |
| `get_playlist_rightnow` | Aktuell låt (föregående, nuvarande, nästa) med full metadata |

</details>

<details>
<summary><strong>Musik & Spellistor (4 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `get_playlist_rightnow` | Låt som spelas just nu på en kanal |
| `get_channel_playlist` | Låthistorik för en kanal inom tidsintervall |
| `get_program_playlist` | Låthistorik för ett program inom tidsintervall |
| `get_episode_playlist` | Komplett spellista för ett avsnitt |

*Alla låtar inkluderar: titel, artist, kompositör, album, skivbolag, producent, textförfattare, dirigent och tidsstämplar*

</details>

<details>
<summary><strong>Program & Podcasts (4 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `search_programs` | Sök efter program (med relevansranking) |
| `get_program` | Hämta programdetaljer |
| `list_program_categories` | Alla 15 programkategorier |
| `get_program_schedule` | När ett program sänds |

</details>

<details>
<summary><strong>Sändningar & Podcasts (3 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `list_broadcasts` | Tillgängliga sändningar (30 dagar) |
| `list_podfiles` | Podcastfiler för ett program |
| `get_podfile` | Specifik podcastfil med metadata |

</details>

<details>
<summary><strong>Avsnitt (5 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `list_episodes` | Lista avsnitt från ett program |
| `search_episodes` | Fulltextsökning i avsnitt |
| `get_episode` | Specifikt avsnitt med ljudfiler |
| `get_episodes_batch` | Hämta flera avsnitt samtidigt |
| `get_latest_episode` | Senaste avsnittet för ett program |

</details>

<details>
<summary><strong>Kanaler (2 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `list_channels` | Alla kanaler (P1-P4, lokalstationer) |
| `get_channel_rightnow` | Vad som spelas nu på en kanal |

</details>

<details>
<summary><strong>Schema (2 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `get_channel_schedule` | Tablå för en kanal och datum |
| `get_program_broadcasts` | Kommande sändningar för ett program |

</details>

<details>
<summary><strong>Nyheter (2 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `list_news_programs` | Översikt av nyhetsprogram |
| `get_latest_news_episodes` | Senaste nyhetssändningar |

</details>

<details>
<summary><strong>Trafik (2 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `get_traffic_messages` | Trafikmeddelanden per område |
| `get_traffic_areas` | Trafikområden (med GPS-uppslag) |

</details>

<details>
<summary><strong>Övrigt (5 tools)</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `search_all` | Global sökning (program + avsnitt + kanaler) |
| `get_recently_published` | Nyligen publicerat innehåll |
| `get_top_stories` | Utvalt innehåll från SR |
| `list_extra_broadcasts` | Extra sändningar (sport, special events) |
| `get_episode_group` | Samling av avsnitt |

</details>

---

## Användningsområden

### Live Radio Dashboard
Kombinera `get_all_rightnow`, `get_latest_news_episodes` och `get_traffic_messages` för en komplett översikt av vad som händer just nu.

### Musikdatabas & Spellistehistorik
Använd `get_channel_playlist` för att analysera musikhistorik på P2 Musik under en vecka, eller `get_program_playlist` för att se alla låtar som spelats i ett musikprogram.

### Smart Podcast-sökning
Använd `search_programs` med kategorifilter för att hitta relevanta podcasts baserat på intressen. Sökningen använder klient-side relevansranking för bästa resultat.

### Trafikanalys
Hämta `get_traffic_messages` för specifika geografiska områden och skapa realtidsvarningar för pendlingsrutter.

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
