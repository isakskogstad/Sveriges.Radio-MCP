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

### HTTP Server with Authentication
```bash
# Copy environment template
cp .env.example .env

# Set your auth token (optional)
echo "MCP_AUTH_TOKEN=your-secret-token" >> .env

# Start HTTP server
npm run start:streamable
```

**Endpoints:**
- `GET /health` - Health check (no auth required)
- `GET /sse` or `/mcp` - MCP Server connection (Bearer token if configured)

**Authentication:**
If `MCP_AUTH_TOKEN` is set, include in requests:
```bash
curl -H "Authorization: Bearer your-secret-token" \
  https://your-server.com/sse
```

**For Lovable/AI Tools:**
```javascript
// Configure MCP endpoint with Bearer token
{
  "url": "https://your-server.com/sse",
  "headers": {
    "Authorization": "Bearer your-secret-token"
  }
}
```

## 📡 Available Tools (26 total) ✅

### Channels (2 tools)
- ✅ `list_channels` - List all radio channels (P1, P2, P3, P4, local stations)
- ✅ `get_channel_rightnow` - What's broadcasting NOW on channel(s)

### Programs (4 tools)
- ✅ `search_programs` - Search for radio programs by name/category/channel
- ✅ `get_program` - Get detailed program information
- ✅ `list_program_categories` - All program categories (News, Music, Sport, etc.)
- ✅ `get_program_schedule` - When a program is broadcast

### Episodes (5 tools)
- ✅ `list_episodes` - List all episodes for a program
- ✅ `search_episodes` - Full-text search in episodes
- ✅ `get_episode` - Get episode with streaming/download audio files
- ✅ `get_episodes_batch` - Get multiple episodes at once (efficient!)
- ✅ `get_latest_episode` - Get the newest episode for a program

### Schedule (3 tools)
- ✅ `get_channel_schedule` - TV guide-style schedule for a channel
- ✅ `get_program_broadcasts` - Upcoming broadcasts for a program
- ✅ `get_all_rightnow` - Complete overview of all channels NOW

### Playlists ⭐ NEW (3 tools)
- ✅ `get_playlist_rightnow` - Current song playing on a channel
- ✅ `get_episode_playlist` - Complete playlist for an episode
- ✅ `search_playlists` - Search for songs, artists, albums

### News (2 tools)
- ✅ `list_news_programs` - All news programs (Ekot, Ekonomiekot, etc.)
- ✅ `get_latest_news_episodes` - Latest news episodes (max 1 day old)

### Traffic (2 tools)
- ✅ `get_traffic_messages` - Traffic incidents, accidents, roadworks
- ✅ `get_traffic_areas` - Traffic areas (with optional GPS lookup)

### Toplists & More (5 tools)
- ✅ `get_recently_published` - Recently published shows/podcasts
- ✅ `get_top_stories` - Featured content from SR
- ✅ `list_extra_broadcasts` - Special broadcasts (sports, events)
- ✅ `get_episode_group` - Episode collections (e.g., "Famous Crimes")
- ✅ `search_all` - Global search across programs, episodes & channels

## 📚 Resources (4 total) ✅

Quick reference data available via `ReadResource`:

- **sr://api/info** - API capabilities, versioning, rate limits, defaults
- **sr://channels/all** - Complete channel list with IDs (P1-P4, all local stations)
- **sr://audio/quality-guide** - Audio quality levels, formats, recommendations
- **sr://categories/programs** - All 15 program categories with IDs

## 🎯 Prompts (6 total) ✅

Pre-built workflows via `GetPrompt`:

### 1. `find-podcast`
Find podcasts by topic (e.g., "historia", "true crime", "musik")
```
Arguments: topic (required), limit (optional)
```

### 2. `whats-on-now`
See what's broadcasting NOW on SR
```
Arguments: channel (optional - P1, P2, P3, P4)
```

### 3. `traffic-nearby`
Check traffic conditions in your area
```
Arguments: location (required), severity (optional 1-5)
```

### 4. `news-briefing`
Latest news summary from SR
```
Arguments: program (optional - "Ekot", "Ekonomiekot", etc.)
```

### 5. `explore-schedule`
Browse channel schedule (TV guide style)
```
Arguments: channel (required), date (optional YYYY-MM-DD)
```

### 6. `whats-playing-now` 🎵
Current song on a music channel
```
Arguments: channel (required - "P2", "P3", "SR Klassiskt")
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

**Version:** 1.0.0
**Status:** ✅ Production Ready!

- ✅ **26 Tools** - Complete SR API coverage
- ✅ **4 Resources** - Quick reference data
- ✅ **6 Prompts** - Pre-built workflows
- ✅ **Bearer Token Auth** - Optional security for HTTP deployments
- ✅ **ETag Caching** - Optimal performance
- ✅ **TypeScript** - Full type safety
- ⏳ **Render Deployment** - Coming soon

Sveriges Radio's API is maintained but not actively developed. This MCP server provides stable access to all available endpoints.
