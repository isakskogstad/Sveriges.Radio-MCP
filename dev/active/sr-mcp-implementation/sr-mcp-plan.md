# Sveriges Radio MCP Server - Implementation Plan

**Last Updated:** 2025-01-20
**Status:** In Progress
**Version:** 1.0.0

## Project Overview

**Name:** `sverigesradio-mcp`
**Purpose:** MCP server for Sveriges Radio's Open API - access to radio programs, podcasts, live streams, schedules, news, and traffic
**API Base:** `https://api.sr.se/api/v2/` (HTTPS confirmed via sverigesradio-api-js)

## Key Learnings from sverigesradio-api-js

From analyzing the existing JS library:
- ✅ Use HTTPS (not HTTP as in docs)
- ✅ Default `audioquality: 'hi'` for best quality
- ✅ Discovered `/playlists` endpoints (not in HTML docs!)
- ✅ Default `liveaudiotemplateid: 2` (MP3 for compatibility)

## Tool Architecture - 26 Tools Total

### Group 1: Channels (2 tools)
1. `list_channels` - List all radio channels with live streams
2. `get_channel_rightnow` - What's broadcasting NOW on channel(s)

### Group 2: Programs (4 tools)
3. `search_programs` - Search for radio programs
4. `get_program` - Get program details
5. `list_program_categories` - List all program categories
6. `get_program_schedule` - Get schedule for a program

### Group 3: Episodes (5 tools)
7. `list_episodes` - List episodes for a program
8. `search_episodes` - Full-text search in episodes
9. `get_episode` - Get specific episode with audio files
10. `get_episodes_batch` - Get multiple episodes at once
11. `get_latest_episode` - Get latest episode for a program

### Group 4: Schedule (3 tools)
12. `get_channel_schedule` - Get TV guide-style schedule
13. `get_program_broadcasts` - Get upcoming broadcasts
14. `get_all_rightnow` - What's on NOW across ALL channels

### Group 5: News (2 tools)
15. `list_news_programs` - List all news programs
16. `get_latest_news_episodes` - Latest news episodes (max 1 day old)

### Group 6: Traffic (2 tools)
17. `get_traffic_messages` - Traffic incidents/messages
18. `get_traffic_areas` - Traffic areas (with optional GPS lookup)

### Group 7: Playlists ⭐ NEW (3 tools)
19. `get_playlist_rightnow` - Current song playing on channel
20. `get_episode_playlist` - Full playlist for an episode
21. `search_playlists` - Search in playlists

### Group 8: Toplists (2 tools)
22. `get_recently_published` - Recently published shows/podcasts
23. `get_top_stories` - Top stories/featured content

### Group 9: Extra & Groups (2 tools)
24. `list_extra_broadcasts` - Special/extra broadcasts
25. `get_episode_group` - Episode collections/groups

### Group 10: Utility (1 tool)
26. `search_all` - Global search across all content types

## Resources (4)
1. `sr://api/info` - API information and capabilities
2. `sr://channels/all` - Complete channel list with IDs
3. `sr://audio/quality-guide` - Audio quality/format guide
4. `sr://categories/programs` - Program categories reference

## Prompts (6) - UPDATED
1. `find-podcast` - Find and listen to podcasts
2. `whats-on-now` - See what's broadcasting now
3. `traffic-nearby` - Check traffic in your area
4. `news-briefing` - Latest news summary
5. `explore-schedule` - Browse channel schedule
6. `whats-playing-now` ⭐ NEW - Current song on channel

## Implementation Phases

### Phase 1: Core Infrastructure ✅ CURRENT
- [x] Project setup (TypeScript + MCP SDK)
- [ ] SR API client with caching (HTTP 304 support)
- [ ] Base types and schemas
- [ ] Error handling framework
- [ ] 5 core tools for testing

### Phase 2: Complete Tools
- [ ] All 26 tools implemented
- [ ] Parameter validation (Zod)
- [ ] Response formatting
- [ ] Integration tests

### Phase 3: Resources & Prompts
- [ ] 4 resources
- [ ] 6 prompts
- [ ] Documentation

### Phase 4: Deployment
- [ ] Render deployment
- [ ] npm package
- [ ] MCP registry submission

## Key Design Decisions

### 1. Caching Strategy
```typescript
// Respect SR's HTTP cache headers
// Use ETags for 304 Not Modified responses
// 5 cache levels: VeryShort → VeryLong
```

### 2. Error Handling
```typescript
class SRAPIError extends Error {
  code: 'NOT_FOUND' | 'INVALID_PARAMS' | 'API_ERROR' | 'RATE_LIMIT'
}
```

### 3. Default Parameters
```typescript
{
  format: 'json',
  audioquality: 'hi',  // Best quality
  pagination: true,
  size: 10,
  liveaudiotemplateid: 2  // MP3 stream
}
```

## Success Criteria

**Technical:**
- All 26 tools working correctly
- <100ms avg response time (cached)
- >90% test coverage
- Zero critical errors

**User Experience:**
- Clear, comprehensive docs
- All 6 prompts working
- Easy installation (npm + remote)

**Deployment:**
- Live on Render
- Published on npm
- Listed on MCP registry

## References
- SR API Docs: https://api.sr.se/api/documentation/v2/
- sverigesradio-api-js: Inspiration for endpoints
- Skolverket MCP: Reference architecture
- Riksdag MCP: Tool design patterns
