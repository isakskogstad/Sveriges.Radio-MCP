# Sveriges Radio MCP - Context & Key Decisions

**Last Updated:** 2025-01-20

## Project Structure

```
sverigesradio-mcp/
├── src/
│   ├── index.ts                      # MCP server setup
│   ├── streamable-http-server.ts     # HTTP transport
│   ├── types/
│   │   ├── sr-api.ts                 # SR API response types
│   │   └── mcp.ts                    # MCP tool schemas
│   ├── tools/
│   │   ├── channels.ts               # 2 tools
│   │   ├── programs.ts               # 4 tools
│   │   ├── episodes.ts               # 5 tools
│   │   ├── schedule.ts               # 3 tools
│   │   ├── news.ts                   # 2 tools
│   │   ├── traffic.ts                # 2 tools
│   │   ├── playlists.ts              # 3 tools ⭐ NEW
│   │   ├── toplists.ts               # 2 tools
│   │   ├── extra.ts                  # 2 tools (extra + groups)
│   │   └── utility.ts                # 1 tool (search_all)
│   ├── resources/
│   │   └── index.ts                  # 4 resources
│   ├── prompts/
│   │   └── index.ts                  # 6 prompts
│   ├── lib/
│   │   ├── sr-client.ts              # HTTP client with caching
│   │   ├── cache.ts                  # Cache implementation
│   │   ├── validators.ts             # Zod schemas
│   │   └── errors.ts                 # Error classes
│   └── constants.ts                  # API config
├── tests/
├── package.json
└── tsconfig.json
```

## Key Files & Integration Points

### 1. SR API Client (`src/lib/sr-client.ts`)
**Purpose:** Central HTTP client for all SR API calls
**Features:**
- HTTP caching with ETags (304 Not Modified)
- Automatic retry on transient errors
- Rate limiting protection
- Type-safe responses

**Key Methods:**
```typescript
class SRClient {
  async fetch<T>(endpoint: string, params?: Record<string, any>): Promise<T>
  async fetchPaginated<T>(endpoint: string, params?: PaginationParams): Promise<PaginatedResponse<T>>
}
```

### 2. Tool Registration (`src/index.ts`)
**All 26 tools registered here:**
```typescript
const tools = [
  // Channels (2)
  ...channelTools,
  // Programs (4)
  ...programTools,
  // Episodes (5)
  ...episodeTools,
  // Schedule (3)
  ...scheduleTools,
  // News (2)
  ...newsTools,
  // Traffic (2)
  ...trafficTools,
  // Playlists (3) ⭐ NEW
  ...playlistTools,
  // Toplists (2)
  ...toplistTools,
  // Extra & Groups (2)
  ...extraTools,
  // Utility (1)
  ...utilityTools
];
```

### 3. Type Definitions (`src/types/sr-api.ts`)
**Critical types from SR API:**
```typescript
interface SRChannel {
  id: number;
  name: string;
  image: string;
  color: string;
  tagline: string;
  siteUrl: string;
  liveAudio: { url: string; statkey: string };
  channelType: 'Rikskanal' | 'Lokal kanal';
}

interface SREpisode {
  id: number;
  title: string;
  description: string;
  publishDateUtc: string;
  url: string;
  imageUrl: string;
  listenPodFile?: PodFile;
  downloadPodFile?: PodFile;
}

interface SRPlaylist {
  song: {
    title: string;
    artist: string;
    composer?: string;
    albumName?: string;
    recordLabel?: string;
  };
  startTimeUtc: string;
  stopTimeUtc: string;
}
```

## Important Discoveries

### From sverigesradio-api-js Analysis
1. **HTTPS required** - Use `https://api.sr.se/api/v2/` (not HTTP!)
2. **Playlist endpoints exist:**
   - `/playlists/rightnow?channelid={id}` - Current song
   - `/playlists/getplaylistbyepisodeid?id={id}` - Episode playlist
3. **Best defaults:**
   - `audioquality: 'hi'` (highest quality)
   - `format: 'json'`
   - `liveaudiotemplateid: 2` (MP3 stream)

### SR API Quirks
1. **Pagination default is FALSE** - Must explicitly enable
2. **Cache levels vary** - Some endpoints cached 12h, others <1min
3. **No authentication** - Public API (but respect rate limits)
4. **Date format:** `YYYY-MM-DD` for filters
5. **UTC timestamps** - All times in UTC, convert for Swedish users

## Design Patterns (from Skolverket/Riksdag MCPs)

### Tool Structure
```typescript
{
  name: "verb_noun",  // e.g., get_episode, list_channels
  description: "Clear Swedish description",
  inputSchema: zodSchema,
  handler: async (params) => {
    // 1. Validate
    // 2. Call SR API
    // 3. Format response
    // 4. Return
  }
}
```

### Error Handling Pattern
```typescript
try {
  const data = await srClient.fetch(endpoint, params);
  return { success: true, data };
} catch (error) {
  if (error instanceof SRAPIError) {
    return { success: false, error: error.message, code: error.code };
  }
  throw error; // Re-throw unexpected errors
}
```

### Caching Pattern
```typescript
// Check cache first
const cached = cache.get(cacheKey);
if (cached && !isExpired(cached)) {
  return cached.data;
}

// Fetch with If-None-Match
const response = await fetch(url, {
  headers: { 'If-None-Match': cached?.etag }
});

if (response.status === 304) {
  // Refresh expiry, return cached
  cache.touch(cacheKey);
  return cached.data;
}

// Update cache
cache.set(cacheKey, {
  data: await response.json(),
  etag: response.headers.get('etag'),
  expiresAt: calculateExpiry(response)
});
```

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "zod": "^3.23.8",
    "node-cache": "^5.1.2"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "vitest": "^2.1.0",
    "tsx": "^4.19.0"
  }
}
```

## Environment Variables

```bash
# Development
SR_API_BASE=https://api.sr.se/api/v2
NODE_ENV=development
PORT=3000

# Production (Render)
NODE_ENV=production
PORT=3000
```

## Integration Checklist

Before deploying:
- [ ] All 26 tools tested against real SR API
- [ ] Cache headers respected (check 304 responses)
- [ ] Error scenarios handled (404, 500, timeout)
- [ ] Swedish characters handled correctly (UTF-8)
- [ ] Audio URLs accessible and playable
- [ ] Pagination works correctly
- [ ] Date filtering accurate

## References

**SR API:**
- Docs: https://api.sr.se/api/documentation/v2/
- Base: https://api.sr.se/api/v2/

**Reference Projects:**
- Skolverket MCP: 29 tools, educational API
- Riksdag MCP: Parliamentary data, complex analysis
- sverigesradio-api-js: Endpoint discovery

**MCP SDK:**
- Docs: https://modelcontextprotocol.io
- TypeScript: https://github.com/modelcontextprotocol/typescript-sdk
