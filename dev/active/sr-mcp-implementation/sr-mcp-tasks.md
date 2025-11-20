# Sveriges Radio MCP - Implementation Tasks

**Last Updated:** 2025-01-20
**Status:** Phase 1 - Core Infrastructure

## Phase 1: Core Infrastructure (Week 1)

### 1.1 Project Setup
- [x] Create project directory structure
- [x] Create dev docs (plan.md, context.md, tasks.md)
- [ ] Initialize npm project
- [ ] Setup TypeScript configuration
- [ ] Install MCP SDK dependencies
- [ ] Setup build scripts (build, start, start:streamable)
- [ ] Create .gitignore

### 1.2 SR API Client
- [ ] Create `src/lib/sr-client.ts`
  - HTTP fetch with error handling
  - ETag-based caching (304 support)
  - Query parameter builder
  - Response type validation
- [ ] Create `src/lib/cache.ts`
  - In-memory cache with TTL
  - ETag storage
  - Cache invalidation
- [ ] Create `src/lib/errors.ts`
  - SRAPIError class
  - Error code enum
  - Error formatter
- [ ] Create `src/constants.ts`
  - API base URL (HTTPS)
  - Default parameters
  - Cache TTL values

### 1.3 Type Definitions
- [ ] Create `src/types/sr-api.ts`
  - SRChannel interface
  - SRProgram interface
  - SREpisode interface
  - SRScheduleEpisode interface
  - SRTrafficMessage interface
  - SRPlaylist interface ⭐ NEW
  - PaginatedResponse<T> generic
- [ ] Create `src/types/mcp.ts`
  - Tool schemas (Zod)
  - Tool handler types
  - Resource types

### 1.4 Core Tools (5 for initial testing)
- [ ] `list_channels` (src/tools/channels.ts)
- [ ] `get_channel_rightnow` (src/tools/channels.ts)
- [ ] `search_programs` (src/tools/programs.ts)
- [ ] `search_episodes` (src/tools/episodes.ts)
- [ ] `get_episode` (src/tools/episodes.ts)

### 1.5 MCP Server Setup
- [ ] Create `src/index.ts` (stdio transport)
- [ ] Create `src/streamable-http-server.ts` (HTTP transport)
- [ ] Register initial 5 tools
- [ ] Test with MCP Inspector

### 1.6 Testing Framework
- [ ] Setup Vitest
- [ ] Create test fixtures (mock SR responses)
- [ ] Write unit tests for sr-client
- [ ] Write integration test for 1 tool

**Deliverable:** Working MCP server with 5 tools, testable locally

---

## Phase 2: Complete Tools (Week 2)

### 2.1 Program Tools (4 total)
- [ ] `get_program` (src/tools/programs.ts)
- [ ] `list_program_categories` (src/tools/programs.ts)
- [ ] `get_program_schedule` (src/tools/programs.ts)

### 2.2 Episode Tools (3 more)
- [ ] `list_episodes` (src/tools/episodes.ts)
- [ ] `get_episodes_batch` (src/tools/episodes.ts)
- [ ] `get_latest_episode` (src/tools/episodes.ts)

### 2.3 Schedule Tools (3)
- [ ] `get_channel_schedule` (src/tools/schedule.ts)
- [ ] `get_program_broadcasts` (src/tools/schedule.ts)
- [ ] `get_all_rightnow` (src/tools/schedule.ts)

### 2.4 News Tools (2)
- [ ] `list_news_programs` (src/tools/news.ts)
- [ ] `get_latest_news_episodes` (src/tools/news.ts)

### 2.5 Traffic Tools (2)
- [ ] `get_traffic_messages` (src/tools/traffic.ts)
- [ ] `get_traffic_areas` (src/tools/traffic.ts)

### 2.6 Playlist Tools ⭐ NEW (3)
- [ ] `get_playlist_rightnow` (src/tools/playlists.ts)
- [ ] `get_episode_playlist` (src/tools/playlists.ts)
- [ ] `search_playlists` (src/tools/playlists.ts)

### 2.7 Toplist Tools (2)
- [ ] `get_recently_published` (src/tools/toplists.ts)
- [ ] `get_top_stories` (src/tools/toplists.ts)

### 2.8 Extra & Groups Tools (2)
- [ ] `list_extra_broadcasts` (src/tools/extra.ts)
- [ ] `get_episode_group` (src/tools/extra.ts)

### 2.9 Utility Tool (1)
- [ ] `search_all` (src/tools/utility.ts)

### 2.10 Validation
- [ ] Add Zod schemas for all tools
- [ ] Parameter validation tests
- [ ] Error scenario tests

**Deliverable:** All 26 tools working with validation

---

## Phase 3: Resources & Prompts (Week 3)

### 3.1 Resources (4)
- [ ] `sr://api/info` - API information
- [ ] `sr://channels/all` - Channel list with IDs
- [ ] `sr://audio/quality-guide` - Audio formats/quality
- [ ] `sr://categories/programs` - Program categories

### 3.2 Prompts (6)
- [ ] `find-podcast` - Find podcasts by topic
- [ ] `whats-on-now` - Current broadcasts
- [ ] `traffic-nearby` - Traffic in area
- [ ] `news-briefing` - Latest news summary
- [ ] `explore-schedule` - Browse schedule
- [ ] `whats-playing-now` ⭐ NEW - Current song

### 3.3 Documentation
- [ ] README.md
  - Installation instructions
  - Quick start guide
  - Tool catalog
  - Example usage
- [ ] API_COVERAGE.md
  - SR API endpoints covered
  - Mapping table
- [ ] CHANGELOG.md
  - Version history

### 3.4 Comprehensive Testing
- [ ] Unit tests for all tools (>90% coverage)
- [ ] Integration tests with real API
- [ ] Error handling tests
- [ ] Cache behavior tests
- [ ] Pagination tests

**Deliverable:** Complete MCP server ready for deployment

---

## Phase 4: Deployment & Publication (Week 4)

### 4.1 Render Deployment
- [ ] Create Render account/project
- [ ] Configure build settings
  - Build: `npm install && npm run build`
  - Start: `npm run start:streamable`
- [ ] Set environment variables
- [ ] Deploy and test endpoint
- [ ] Setup health check endpoint

### 4.2 npm Package
- [ ] Configure package.json for publishing
  - Name: `sverigesradio-mcp`
  - Version: `1.0.0`
  - Keywords: mcp, radio, sweden, podcast
  - Bin scripts
- [ ] Build distribution
- [ ] Test package locally (`npm link`)
- [ ] Publish to npm

### 4.3 MCP Registry
- [ ] Create registry submission
  - Name, description, tags
  - Transport URLs (HTTP + stdio)
  - Tool count (26)
  - Resource count (4)
  - Prompt count (6)
- [ ] Submit to registry.modelcontextprotocol.io
- [ ] Verify listing

### 4.4 Documentation Site
- [ ] Create GitHub repository
- [ ] Setup GitHub Pages
- [ ] Create landing page
  - Features showcase
  - Installation guide
  - Tool examples
  - Prompt examples
- [ ] Add badges (npm version, build status)

### 4.5 Final Testing
- [ ] Test remote endpoint
- [ ] Test npm package installation
- [ ] Test all 26 tools in production
- [ ] Verify caching works
- [ ] Performance benchmarks

**Deliverable:** Public MCP server at https://sr-mcp.onrender.com

---

## Ongoing Maintenance

### Post-Launch
- [ ] Monitor error logs
- [ ] Track API changes from SR
- [ ] Gather user feedback
- [ ] Fix bugs as reported
- [ ] Add new features if SR adds endpoints

### Version Updates
- [ ] 1.0.0 - Initial release (26 tools)
- [ ] 1.1.0 - Bug fixes + performance improvements
- [ ] 1.2.0 - New features based on feedback
- [ ] 2.0.0 - Major API updates (if SR releases v3)

---

## Quick Reference: Current Status

**Completed:**
- [x] Planning phase
- [x] Dev docs created
- [x] Architecture designed

**In Progress:**
- [ ] Phase 1: Core Infrastructure

**Next Up:**
- Initialize npm project
- Create SR API client
- Implement first 5 tools

**Total Progress:** 3/20 major milestones (15%)
