# Sveriges Radio MCP Server

> Modern MCP server for Sveriges Radio's Open API - access Swedish radio programs, podcasts, live streams, playlists, news and traffic.

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/isakskogstad/Sveriges.Radio-MCP)
[![MCP Protocol](https://img.shields.io/badge/MCP-2025--03--26-green)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

---

## What's New in v1.2.0

### Bug Fixes
- **`get_playlist_rightnow`** - Now correctly returns current song, previous song, next song and channel data (was returning null)
- **`search_programs`** - Improved search with client-side relevance ranking (searching "P3 Dokumentar" now returns P3 Dokumentar as first result)

See [CHANGELOG.md](CHANGELOG.md) for full details.

---

## Features

- **Audio Content** - Direct access to MP3 files for streaming and download
- **Metadata** - Detailed information about programs, channels and episodes
- **Live Data** - Real-time information about what's playing right now
- **Playlists** - Complete music history with artist, title, album, composer
- **Traffic Info** - Current traffic messages with geographic coordinates
- **Search** - Full-text search in programs, episodes and content

---

## Quick Start

### Remote Server (Recommended)

**No installation needed!** Use our hosted server:

```
https://sverigesradio-mcp.onrender.com/mcp
```

#### Claude Desktop / Claude Code

Add to your Claude MCP configuration (`claude_desktop_config.json` or `.claude.json`):

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

Add to `.cursor/mcp.json`:

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

#### Other MCP Clients

Use **StreamableHTTP transport** (MCP 2025-03-26 spec):
- **Endpoint:** `https://sverigesradio-mcp.onrender.com/mcp`
- **Auth:** None (public API)
- **Format:** JSON-RPC 2.0

---

### Local Installation

#### From Source

```bash
git clone https://github.com/isakskogstad/Sveriges.Radio-MCP.git
cd Sveriges.Radio-MCP
npm install
npm run build
npm start
```

#### Claude Code/Desktop (local)

```bash
# Clone and build
git clone https://github.com/isakskogstad/Sveriges.Radio-MCP.git
cd Sveriges.Radio-MCP && npm install && npm run build

# Add to Claude
claude mcp add sverigesradio node /path/to/Sveriges.Radio-MCP/dist/index.js
```

---

## Tools (26 total)

### Real-time & Live (3 tools)
| Tool | Description |
|------|-------------|
| `get_all_rightnow` | What's playing on ALL channels right now |
| `get_channel_rightnow` | Current program on a specific channel |
| `get_playlist_rightnow` | Current song (previous, current, next) with full metadata |

### Music & Playlists (4 tools)
| Tool | Description |
|------|-------------|
| `get_playlist_rightnow` | Song playing right now on a channel |
| `get_channel_playlist` | Song history for a channel in time range |
| `get_program_playlist` | Song history for a program in time range |
| `get_episode_playlist` | Complete playlist for an episode |

*All songs include: title, artist, composer, album, record label, producer, lyricist, conductor and timestamps*

### Programs & Podcasts (4 tools)
| Tool | Description |
|------|-------------|
| `search_programs` | Search for programs (with relevance ranking) |
| `get_program` | Get program details |
| `list_program_categories` | All 15 program categories |
| `get_program_schedule` | When a program airs |

### Broadcasts & Podcasts (3 tools)
| Tool | Description |
|------|-------------|
| `list_broadcasts` | Available broadcasts (30 days) |
| `list_podfiles` | Podcast files for a program |
| `get_podfile` | Specific podcast file with metadata |

### Episodes (5 tools)
| Tool | Description |
|------|-------------|
| `list_episodes` | List episodes from a program |
| `search_episodes` | Full-text search in episodes |
| `get_episode` | Specific episode with audio files |
| `get_episodes_batch` | Fetch multiple episodes at once |
| `get_latest_episode` | Latest episode for a program |

### Channels (2 tools)
| Tool | Description |
|------|-------------|
| `list_channels` | All channels (P1-P4, local stations) |
| `get_channel_rightnow` | What's playing now on a channel |

### Schedule (2 tools)
| Tool | Description |
|------|-------------|
| `get_channel_schedule` | Schedule for a channel and date |
| `get_program_broadcasts` | Upcoming broadcasts for a program |

### News (2 tools)
| Tool | Description |
|------|-------------|
| `list_news_programs` | Overview of news programs |
| `get_latest_news_episodes` | Latest news broadcasts |

### Traffic (2 tools)
| Tool | Description |
|------|-------------|
| `get_traffic_messages` | Traffic messages by area |
| `get_traffic_areas` | Traffic areas (with GPS lookup) |

### Miscellaneous (5 tools)
| Tool | Description |
|------|-------------|
| `search_all` | Global search (programs + episodes + channels) |
| `get_recently_published` | Recently published content |
| `get_top_stories` | Featured content from SR |
| `list_extra_broadcasts` | Extra broadcasts (sports, special events) |
| `get_episode_group` | Collection of episodes |

### Audio Templates (2 tools)
| Tool | Description |
|------|-------------|
| `list_ondemand_audio_templates` | URL templates for podcast audio |
| `list_live_audio_templates` | URL templates for live streams |

---

## Usage Examples

### 1. Live Radio Dashboard
Combine `get_all_rightnow`, `get_latest_news_episodes` and `get_traffic_messages` for a complete overview of what's happening right now.

### 2. Music Database & Playlist History
Use `get_channel_playlist` to analyze music history on P2 Musik over a week, or `get_program_playlist` to see all songs played in a music program. Perfect for discovering new music or creating statistics on most played artists.

### 3. Smart Podcast Search
Use `search_programs` with category filter and analyze metadata to find relevant podcasts based on interests.

**Search Tips:**
- Use `channelId` filter for channel-specific programs (e.g., `channelId: 164` for P3)
- Use `programCategoryId` filter for genre-specific results (e.g., `programCategoryId: 82` for documentaries)
- The search uses client-side relevance ranking for best results

### 4. Traffic Analysis
Fetch `get_traffic_messages` for specific geographic areas and create real-time alerts for commuting routes.

---

## Resources (4 total)

Resources provide quick access to reference data:

| Resource | Description |
|----------|-------------|
| `sr://api/info` | API capabilities, versions, rate limits, caching info |
| `sr://channels/all` | Complete channel list with IDs (P1-P4, local stations) |
| `sr://audio/quality-guide` | Audio quality and formats (hi/normal/low) |
| `sr://categories/programs` | All 15 program categories with descriptions |

---

## Prompts (6 total)

Pre-built workflows for common tasks:

| Prompt | Description |
|--------|-------------|
| `find-podcast` | Find podcasts by topic |
| `whats-on-now` | What's broadcasting right now |
| `whats-playing-now` | Current song on music channels |
| `traffic-nearby` | Traffic situation in your area |
| `news-briefing` | Latest news |
| `explore-schedule` | Browse the schedule |

---

## Development

```bash
npm run dev          # Development mode (stdio)
npm run dev:http     # HTTP server development
npm run build        # Build production
npm test             # Run tests
```

### Project Structure

```
src/
├── index.ts                  # Main entry (stdio transport)
├── streamable-http-server.ts # HTTP server (StreamableHTTP transport)
├── constants.ts              # API constants
├── lib/
│   ├── sr-client.ts          # SR API client with caching
│   ├── errors.ts             # Error handling
│   └── tool-utils.ts         # Tool utilities
├── tools/
│   ├── channels.ts           # Channel tools
│   ├── programs.ts           # Program tools
│   ├── episodes.ts           # Episode tools
│   ├── schedule.ts           # Schedule tools
│   ├── playlists.ts          # Playlist tools
│   ├── news.ts               # News tools
│   ├── traffic.ts            # Traffic tools
│   └── misc.ts               # Miscellaneous tools
├── types/
│   └── sr-api.ts             # TypeScript interfaces
├── prompts/                  # MCP prompts
└── resources/                # MCP resources
```

---

## API Information

**Sveriges Radio Open API v2**
- Base URL: `https://api.sr.se/api/v2/`
- Format: JSON/XML
- Auth: None (public API)
- Caching: HTTP ETags (304 Not Modified)
- Documentation: [api.sr.se/api/documentation/v2](https://api.sr.se/api/documentation/v2/)

**Note:** The SR API's built-in search functionality has limitations. This MCP server implements client-side relevance ranking for better search results.

---

## Known Limitations

1. **SR API Search** - The official SR API's search/filter functionality doesn't work reliably for text search. This server compensates with client-side relevance ranking.

2. **Playlist Data** - `get_playlist_rightnow` may return null for channels that don't track music (e.g., talk radio).

3. **Rate Limits** - The SR API has rate limits. The server implements ETag-based caching to reduce requests.

---

## License

MIT (c) Isak Skogstad

## Links

- [GitHub Repository](https://github.com/isakskogstad/Sveriges.Radio-MCP)
- [SR API Documentation](https://api.sr.se/api/documentation/v2/)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Changelog](CHANGELOG.md)
