# Sveriges Radio MCP Server 🎙️

> Modern MCP server för Sveriges Radios öppna API - tillgång till svenska radioprogram, podcasts, livestreams och nyheter.

[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Funktioner

🎵 **Ljudinnehåll** - Direktåtkomst till MP3-filer för streaming och nedladdning
📊 **Metadata** - Detaljerad information om program, kanaler och avsnitt
📡 **Live-data** - Realtidsinformation om vad som sänds just nu
🚗 **Trafikinfo** - Aktuella trafikmeddelanden med geografiska koordinater
🔍 **Sök** - Fulltextsök i program, avsnitt och innehåll

---

## 🚀 Snabbstart

### Lokal Installation
```bash
npm install -g sverigesradio-mcp
sr-mcp
```

### HTTP Server med Auth
```bash
cp .env.example .env
echo "MCP_AUTH_TOKEN=your-secret-token" >> .env
npm run start:streamable
```

**Endpoints:**
- `POST/GET /mcp` - Modern StreamableHTTP endpoint (rekommenderas)
- `GET /sse` - Legacy SSE endpoint
- `GET /health` - Health check

**Auth:**
```bash
curl -H "Authorization: Bearer your-token" \
     -H "Accept: application/json, text/event-stream" \
     https://your-server.com/mcp
```

---

## 🛠️ Verktyg

### Real-time & Live
- `get_all_rightnow` - Vad som sänds på alla kanaler nu
- `get_channel_rightnow` - Aktuellt program på specifik kanal
- `get_playlist_rightnow` - Vilken låt som spelas just nu

### Program & Avsnitt
- `search_programs` - Sök efter program
- `get_program` - Hämta programdetaljer
- `list_episodes` - Lista avsnitt från program
- `get_episode` - Hämta specifikt avsnitt med ljudfiler

### Nyheter & Trafik
- `get_latest_news_episodes` - Senaste nyhetsutsändningar
- `get_traffic_messages` - Trafikmeddelanden per område
- `list_news_programs` - Översikt av nyhetsprogram

### Översikt & Sökning
- `list_channels` - Alla kanaler (P1-P4, lokala stationer)
- `get_channel_schedule` - Tablå för vald kanal
- `search_all` - Global sökning
- `list_program_categories` - Programkategorier

---

## 💡 Användningsexempel

**1. Live Radio Dashboard**
Kombinera `get_all_rightnow`, `get_latest_news_episodes` och `get_traffic_messages` för en komplett översikt av vad som händer just nu.

**2. Smart Podcast-sökning**
Använd `search_programs` med kategorifilter och analysera metadata för att hitta relevanta podcasts baserat på intressen.

**3. Trafikanalys**
Hämta `get_traffic_messages` för specifika geografiska områden och skapa realtidsvarningar för pendlingsstråk.

---

## 📚 Resources (4 st)

- `sr://api/info` - API-capabilities, versioner, rate limits
- `sr://channels/all` - Komplett kanallista med ID:n
- `sr://audio/quality-guide` - Ljudkvalitet och format
- `sr://categories/programs` - Alla 15 programkategorier

## 🎯 Prompts (6 st)

- `find-podcast` - Hitta podcasts efter ämne
- `whats-on-now` - Vad som sänds just nu
- `traffic-nearby` - Trafikläget i ditt område
- `news-briefing` - Senaste nyheterna
- `explore-schedule` - Bläddra i tablån
- `whats-playing-now` - Aktuell låt på musikkanaler

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
- Format: JSON
- Auth: Ingen (publik API)
- Caching: HTTP ETags (304 Not Modified)

---

## 📝 License

MIT © Isak Skogstad

## 🔗 Länkar

[SR API Documentation](https://api.sr.se/api/documentation/v2/) • [MCP Protocol](https://modelcontextprotocol.io) • [GitHub](https://github.com/KSAklfszf921/sverigesradio-mcp)
