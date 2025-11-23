# Sveriges Radio MCP Server 🎙️

> Modern MCP server för Sveriges Radios öppna API - tillgång till svenska radioprogram, podcasts, livestreams, spellistor och nyheter.

[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Funktioner

🎵 **Ljudinnehåll** - Direktåtkomst till MP3-filer för streaming och nedladdning
📊 **Metadata** - Detaljerad information om program, kanaler och avsnitt
📡 **Live-data** - Realtidsinformation om vad som sänds just nu
🎼 **Spellistor** - Komplett musikhistorik med artist, titel, album, kompositör
🚗 **Trafikinfo** - Aktuella trafikmeddelanden med geografiska koordinater
🔍 **Sök** - Fulltextsök i program, avsnitt och innehåll

---

## 🚀 Snabbstart

### Remote Server (Rekommenderat)

**Ingen installation behövs!** Använd vår hostade server:

```
https://sverigesradio-mcp.onrender.com/mcp
```

#### Claude Desktop / Claude Code

Lägg till i din Claude MCP-konfiguration (`claude_desktop_config.json` eller `.claude/config.json`):

```json
{
  "mcpServers": {
    "sverigesradio": {
      "url": "https://sverigesradio-mcp.onrender.com/mcp"
    }
  }
}
```

#### Cursor

Lägg till i `.cursorrules` eller MCP-konfiguration:

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

#### Andra MCP-klienter

Använd **StreamableHTTP transport** (2025-03-26 spec):
- **Endpoint:** `https://sverigesradio-mcp.onrender.com/mcp`
- **Auth:** Ingen (öppen API)
- **Format:** JSON

---

### Lokal Installation

#### Via npm

```bash
npm install -g sverigesradio-mcp
sr-mcp
```

#### Claude Code/Desktop (lokal)

```bash
# Installera
npm install -g sverigesradio-mcp

# Lägg till i Claude-konfiguration
claude mcp add sverigesradio npx sr-mcp
```

#### Cursor (lokal)

```json
{
  "mcpServers": {
    "sverigesradio": {
      "command": "npx",
      "args": ["sr-mcp"]
    }
  }
}
```

#### Från källkod

```bash
git clone https://github.com/KSAklfszf921/sverigesradio-mcp.git
cd sverigesradio-mcp
npm install
npm run build
npm start
```

---

## 🛠️ Verktyg (32 st)

### Real-time & Live (3 tools)
- `get_all_rightnow` - Vad som sänds på alla kanaler nu
- `get_channel_rightnow` - Aktuellt program på specifik kanal
- `get_playlist_rightnow` - Låt som spelas just nu (föregående, nuvarande, nästa)

### Musik & Spellistor (4 tools) 🎵
- `get_playlist_rightnow` - Låt som spelas just nu
- `get_channel_playlist` - Låthistorik för kanal i tidsintervall
- `get_program_playlist` - Låthistorik för program i tidsintervall
- `get_episode_playlist` - Komplett spellista för programavsnitt

*Alla låtar inkluderar: titel, artist, kompositör, album, skivbolag, producent, textförfattare, dirigent och tidsstämplar*

### Program & Poddar (7 tools)
- `search_programs` - Sök efter program
- `get_program` - Hämta programdetaljer
- `list_program_categories` - Alla 15 programkategorier
- `get_program_schedule` - När program sänds
- `list_broadcasts` - Tillgängliga sändningar (30 dagar)
- `list_podfiles` - Poddfiler för program
- `get_podfile` - Specifik poddfil med metadata

### Avsnitt (5 tools)
- `list_episodes` - Lista avsnitt från program
- `search_episodes` - Fulltextsök i avsnitt
- `get_episode` - Specifikt avsnitt med ljudfiler
- `get_episodes_batch` - Hämta flera avsnitt samtidigt
- `get_latest_episode` - Senaste avsnittet för program

### Kanaler (2 tools)
- `list_channels` - Alla kanaler (P1-P4, lokala stationer)
- `get_channel_rightnow` - Vad som sänds nu

### Tablå & Schema (3 tools)
- `get_channel_schedule` - Tablå för vald kanal och datum
- `get_program_broadcasts` - Kommande sändningar för program
- `get_all_rightnow` - Översikt alla kanaler

### Nyheter (2 tools)
- `list_news_programs` - Översikt av nyhetsprogram
- `get_latest_news_episodes` - Senaste nyhetsutsändningar

### Trafik (2 tools)
- `get_traffic_messages` - Trafikmeddelanden per område
- `get_traffic_areas` - Trafikområden (med GPS-sökning)

### Övrigt (7 tools)
- `search_all` - Global sökning (program + avsnitt + kanaler)
- `get_recently_published` - Senast publicerat innehåll
- `get_top_stories` - Featured content från SR
- `list_extra_broadcasts` - Extrasändningar (sport, special events)
- `get_episode_group` - Samling av avsnitt (t.ex. "Kända kriminalfall")
- `list_ondemand_audio_templates` - URL-mallar för podcast
- `list_live_audio_templates` - URL-mallar för live streams

---

## 💡 Användningsexempel

**1. Live Radio Dashboard**
Kombinera `get_all_rightnow`, `get_latest_news_episodes` och `get_traffic_messages` för en komplett översikt av vad som händer just nu.

**2. Musikdatabas & Spellistehistorik**
Använd `get_channel_playlist` för att analysera musikhistorik på P2 musik under en vecka, eller `get_program_playlist` för att se alla låtar som spelats i ett musikprogram. Perfekt för att upptäcka ny musik eller skapa statistik över mest spelade artister.

**3. Smart Podcast-sökning**
Använd `search_programs` med kategorifilter och analysera metadata för att hitta relevanta podcasts baserat på intressen.

**4. Trafikanalys**
Hämta `get_traffic_messages` för specifika geografiska områden och skapa realtidsvarningar för pendlingsstråk.

---

## 📚 Resources (4 st)

Resources ger snabb tillgång till referensdata:

- `sr://api/info` - API-capabilities, versioner, rate limits, caching-info
- `sr://channels/all` - Komplett kanallista med ID:n (P1-P4, lokalradiostationer)
- `sr://audio/quality-guide` - Ljudkvalitet och format (hi/normal/low, streaming vs download)
- `sr://categories/programs` - Alla 15 programkategorier med beskrivningar

---

## 🎯 Prompts (6 st)

Förbyggda workflows för vanliga uppgifter:

- `find-podcast` - Hitta podcasts efter ämne
- `whats-on-now` - Vad som sänds just nu
- `whats-playing-now` - Aktuell låt på musikkanaler (perfekt för P2!)
- `traffic-nearby` - Trafikläget i ditt område
- `news-briefing` - Senaste nyheterna
- `explore-schedule` - Bläddra i tablån

---

## 🔧 Development

```bash
npm run dev          # Development mode
npm run dev:http     # HTTP server development
npm run build        # Build production
npm test             # Run tests
```

---

## 📖 API Information

**Sveriges Radio Open API v2**
- Bas-URL: `https://api.sr.se/api/v2/`
- Format: JSON/XML
- Auth: Ingen (publik API)
- Caching: HTTP ETags (304 Not Modified)
- Dokumentation: [api.sr.se/api/documentation/v2](https://api.sr.se/api/documentation/v2/)

---

## 📝 License

MIT © Isak Skogstad

## 🔗 Länkar

[SR API Documentation](https://api.sr.se/api/documentation/v2/) • [MCP Protocol](https://modelcontextprotocol.io) • [GitHub](https://github.com/KSAklfszf921/sverigesradio-mcp)
