# Sveriges Radio MCP Server 🎙️

MCP server for Sveriges Radio's Open API - access Swedish radio programs, podcasts, live streams, schedules, news, and traffic information.

## 🌟 Features

- **26 Tools** for accessing SR's complete API
- **4 Resources** with reference data
- **6 Prompts** for common use cases
- **ETag-based caching** for optimal performance
- **TypeScript** with full type safety
- **HTTPS** secure connection

## 🚀 Quick Start

### Remote (Recommended)
```bash
# Coming soon - Render deployment
# MCP endpoint: https://sr-mcp.onrender.com/sse
```

### Local Installation
```bash
npm install -g sverigesradio-mcp
sr-mcp
```

### From Source
```bash
git clone https://github.com/KSAklfszf921/sverigesradio-mcp.git
cd sverigesradio-mcp
npm install
npm run build
npm start
```

## 📡 Available Tools (26 total)

### Channels (2)
- `list_channels` - List all radio channels (P1, P2, P3, P4, local)
- `get_channel_rightnow` - What's on NOW across channels

### Programs (4)
- `search_programs` - Search for radio programs
- `get_program` - Get program details
- `list_program_categories` - Program categories
- `get_program_schedule` - Upcoming broadcasts

### Episodes (5)
- `list_episodes` - List episodes for a program
- `search_episodes` - Full-text search
- `get_episode` - Get episode with audio files
- `get_episodes_batch` - Multiple episodes at once
- `get_latest_episode` - Latest episode

### Schedule (3)
- `get_channel_schedule` - TV guide-style schedule
- `get_program_broadcasts` - Upcoming program broadcasts
- `get_all_rightnow` - All channels NOW overview

### Playlists ⭐ NEW (3)
- `get_playlist_rightnow` - Current song playing
- `get_episode_playlist` - Full episode playlist
- `search_playlists` - Search in playlists

### News (2)
- `list_news_programs` - All news programs
- `get_latest_news_episodes` - Latest news (max 1 day old)

### Traffic (2)
- `get_traffic_messages` - Traffic incidents/messages
- `get_traffic_areas` - Traffic areas (with GPS lookup)

### More (9)
- Toplists, Extra broadcasts, Groups, Search

## 🎯 Example Prompts

### Find a Podcast
```
Use find-podcast with topic="historia"
```

### What's On Now?
```
Use whats-on-now with channel="P3"
```

### Traffic Check
```
Use traffic-nearby with location="Stockholm"
```

### Current Song
```
Use whats-playing-now with channel="P2"
```

## 🛠️ Development

```bash
# Development mode
npm run dev

# HTTP server
npm run dev:http

# Build
npm run build

# Test
npm test
```

## 📚 API Coverage

Based on Sveriges Radio's Open API v2:
- Base URL: `https://api.sr.se/api/v2/`
- Format: JSON
- Authentication: None (public API)
- Caching: Respects HTTP ETags (304 Not Modified)

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📝 License

MIT © Isak Skogstad

## 🔗 Links

- [SR API Documentation](https://api.sr.se/api/documentation/v2/)
- [MCP Protocol](https://modelcontextprotocol.io)
- [GitHub Repository](https://github.com/KSAklfszf921/sverigesradio-mcp)

## ⚠️ Status

**Version:** 1.0.0 (Beta)
**Status:** Core infrastructure complete, tools in active development

Sveriges Radio's API is maintained but not actively developed. This MCP server provides stable access to all available endpoints.
