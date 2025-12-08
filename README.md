<p align="center">
  <img width="586" height="252" alt="SR MCP logo1" src="https://github.com/user-attachments/assets/8d268ee5-5dc1-44bb-9759-3c56722c6530" />

</p>

<p align="center">
  <a href="https://registry.modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Registry-blue" alt="MCP Registry"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-2025--03--26-green" alt="Protocol"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.6-blue.svg" alt="TypeScript"></a>
</p>

<p align="center">
  <strong>SR MCP-server</strong>
</p>

<p align="center">
</p>

---

# Sveriges Radio MCP

Koppla MCP-servern till din AI-assistent och ställ frågor på naturligt språk eller hämta data om exemplevis program, podcasts, liveströmmar, spellistor, nyheter och trafikinformation. Servern hämtar data från Sveriges Radios öppna API, som inte längre underhålls men fortfarande går att använda utan problem.

---
## Användingsområden

Här är fyra huvudsakliga användningsområden - med exempelfrågor, tillgängliga tools och app-idéer:

### 📻 1. Live-radio, nyheter & trafikuppdateringar

Håll koll på vad som händer just nu - perfekt för morgonrutinen.

<details open>
<summary><strong>Exempelfrågor du kan ställa</strong></summary>

> *"Ge mig en morgonöversikt - vad sänds på P1, senaste nyheterna och trafikläget i Stockholm"*
>
> *"Vilka program sänds live just nu?"*
>
> *"Sammanfatta de senaste nyheterna från Ekot"*
>
> *"Vad har hänt i Sverige idag?"*
>
> *"Vad går på P1 ikväll mellan 18-21?"*

</details>

<details>
<summary><strong>Tools</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `get_all_rightnow` | Vad som spelas på ALLA kanaler just nu |
| `get_channel_rightnow` | Aktuellt program på en specifik kanal |
| `list_channels` | Alla kanaler (P1-P4, lokalstationer) |
| `get_channel_schedule` | Tablå för en kanal och datum |
| `list_news_programs` | Översikt av nyhetsprogram |
| `get_latest_news_episodes` | Senaste nyhetssändningar |
| `get_traffic_messages` | Trafikmeddelanden per område |
| `get_traffic_areas` | Trafikområden (med GPS-uppslag) |

</details>

**Bygg en app:** Personlig Radio-Dashboard

<img src="docs/images/1-dashboard.png" alt="Radio Dashboard mockup" width="420">

---

### 🎵 2. Musik, spellistor & statistik

Hitta låtar du hört på radion och utforska musikhistorik.

<details>
<summary><strong>Exempelfrågor du kan ställa</strong></summary>

> *"Vilken låt spelades på P3 för ungefär 20 minuter sedan?"*
>
> *"Visa de senaste 10 låtarna som spelats på P2 Musik"*
>
> *"Vilka artister spelas mest på P4?"*
>
> *"Vad spelade de i gårdagens Morgonpasset?"*

</details>

<details>
<summary><strong>Tools</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `get_playlist_rightnow` | Aktuell låt (föregående, nuvarande, nästa) |
| `get_channel_playlist` | Låthistorik för en kanal inom tidsintervall |
| `get_program_playlist` | Låthistorik för ett program |
| `get_episode_playlist` | Komplett spellista för ett avsnitt |

*Metadata: titel, artist, kompositör, album, skivbolag, producent, textförfattare, tidsstämplar*

</details>

**Bygg en app:** "Vad var det för låt?" - Musikidentifierare med Spotify-integration

<img src="docs/images/2-music.png" alt="Music identifier mockup" width="420">

---

### 🎧 3. Podcasts, program & sändningar

Hitta nya podcasts, sök i avsnitt och planera ditt lyssnande.

<details>
<summary><strong>Exempelfrågor du kan ställa</strong></summary>

> *"Jag gillar true crime och dokumentärer. Vilka SR-podcasts passar mig?"*
>
> *"Finns det några bra podcasts om svensk historia?"*
>
> *"Rekommendera en podd för min 45-minuters pendling"*
>
> *"Hitta alla avsnitt av Vetenskapsradion som handlar om AI"*
>
> *"När sänds nästa avsnitt av Filosofiska rummet?"*
>
> *"Vilka programkategorier finns på Sveriges Radio?"*

</details>

<details>
<summary><strong>Tools</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `search_programs` | Sök efter program (med relevansranking) |
| `get_program` | Hämta programdetaljer |
| `list_program_categories` | Alla 15 programkategorier |
| `get_program_schedule` | När ett program sänds |
| `list_broadcasts` | Tillgängliga sändningar (30 dagar) |
| `list_podfiles` | Podcastfiler för ett program |
| `get_podfile` | Specifik podcastfil med metadata |
| `list_episodes` | Lista avsnitt från ett program |
| `search_episodes` | Fulltextsökning i avsnitt |
| `get_episode` | Specifikt avsnitt med ljudfiler |
| `get_latest_episode` | Senaste avsnittet för ett program |
| `get_program_broadcasts` | Kommande sändningar |

</details>

**Bygg en app:** Podcast-rekommendationsmotor baserat på dina intressen

<img src="docs/images/3-podcast.png" alt="Podcast finder mockup" width="420">

---

### 🚗 4. Trafikbevakning

Realtidsinfo om trafikstörningar för din pendling.

<details>
<summary><strong>Exempelfrågor du kan ställa</strong></summary>

> *"Finns det några trafikproblem på E4:an just nu?"*
>
> *"Hur är trafikläget i Stockholm?"*
>
> *"Vilka vägar har störningar i Göteborg?"*
>
> *"Ge mig trafikinfo för min pendling Upplands Väsby → Stockholm"*

</details>

<details>
<summary><strong>Tools</strong></summary>

| Tool | Beskrivning |
|------|-------------|
| `get_traffic_messages` | Trafikmeddelanden per område |
| `get_traffic_areas` | Trafikområden (med GPS-uppslag) |

</details>

**Bygg en app:** Trafikvarnings-bot för Slack/Discord som varnar ditt team

<img src="docs/images/4-traffic.png" alt="Traffic bot mockup" width="420">

---

### Kombinera med andra AI-verktyg

| Kombination | Exempel |
|-------------|---------|
| **+ Kalender** | *"Lägg till Konflikt i min kalender när det sänds"* |
| **+ Webbsökning** | *"Sök mer info om artisten som spelas på P3 just nu"* |
| **+ Anteckningar** | *"Spara länken till senaste P3 Dokumentär"* |

---

## Snabbstart

### Alternativ 1: Remote server (Rekommenderat)

**Ingen installation krävs!** Använd vår hostade server direkt.

<details>
<summary><strong>ChatGPT</strong></summary>

1. Öppna inställningar och aktivera Developer Mode
2. Skapa ny anslutning med URL: `https://sverigesradio-mcp.onrender.com/mcp` 

#### Steg-för-steg – så ansluter du ChatGPT till en MCP-server (tryck play)
![ChatGPT anslutning till MCP](https://github.com/user-attachments/assets/eb99a8ad-2154-4a58-b13f-c1edb57dbf47)


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

### Alternativ 3: Lokal installation

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

## Licens

MIT (c) Isak Skogstad

---

## Länkar

- [SR API Dokumentation](https://api.sr.se/api/documentation/v2/index.html)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Changelog](CHANGELOG.md)

---

## Övrigt

Skapad av Isak Skogstad
