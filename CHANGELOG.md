# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-02

### Fixed

#### 🐛 Critical Bug: `get_playlist_rightnow` Now Works!

- **Root cause**: SR API returns data inside a `playlist` object, but code was reading from root level
- **Before**: Always returned `null` for currentSong, previousSong, nextSong, and channel
- **After**: Correctly parses `response.playlist.song`, `response.playlist.previoussong`, etc.
- Added new `SRPlaylistRightNowResponse` TypeScript interface

#### 🔍 Improved: `search_programs` Returns Relevant Results

- **Root cause**: SR API's `filter` parameter doesn't work correctly for text search
- **Before**: Searching "P3 Dokumentär" returned unrelated programs like "Nyheter P4 Jämtland"
- **After**: Client-side relevance ranking ensures correct results
- **Solution implemented**:
  - Fetches 200 programs per request when searching
  - Scores programs by relevance (exact match > starts with > contains)
  - Sorts results by relevance score
  - Returns `searchInfo` metadata explaining the search method
- **Example**: Searching "P3 Dokumentär" now returns "P3 Dokumentär" as first result!

### Changed

- Updated tool description for `search_programs` with helpful tips
- Added `searchInfo` field to search results for transparency

## [1.1.0] - 2025-11-20

### Added - Modern MCP Server Implementation

#### 🚀 Modern Transport Layer

- **StreamableHTTP Transport** - Added support for 2025-03-26 MCP specification
  - Single `/mcp` endpoint for POST (requests), GET (SSE stream), DELETE (cleanup)
  - Modern clients (Claude web, etc.) now fully supported
  - Backward compatible with legacy SSE transport via `/sse` endpoint
  - Dual transport support in same server instance

#### 🔐 Session Management

- **Stateful Conversations** - Full session management implementation
  - Sessions tracked via `Mcp-Session-Id` header
  - Automatic session creation on initialize
  - Session reuse for subsequent requests
  - Automatic cleanup on session close
  - In-memory storage using JavaScript Map for fast lookups
  - Health endpoint reports active sessions

#### 📚 Enhanced LLM Instructions

- **Comprehensive Server Instructions** - Built-in guidance for LLMs
  - Categorized tool descriptions (Program & Poddar, Avsnitt, Tablå, etc.)
  - Usage tips and best practices
  - Example usage patterns
  - Resource and Prompt references
  - Applied to both stdio and HTTP transports

#### ⚠️ JSON-RPC Error Handling

- **Standardized Error Codes** - Following JSON-RPC 2.0 specification
  - `-32000`: Missing Bearer token
  - `-32001`: Invalid or expired token
  - `-32003`: Session errors (missing/invalid session ID)
  - `-32603`: Internal server errors
  - Proper `WWW-Authenticate` header on 401 responses
  - Error responses include request ID for correlation

#### 🔍 Enhanced Health Endpoint

- **Detailed Server Status** - Extended health check response
  - Service name and version
  - Transport type information
  - Tool, resource, and prompt counts
  - Authentication status
  - Active session counts (modern and legacy)

### Changed

- **HTTP Server** - Complete rewrite with modern architecture
  - Replaced simple SSE-only implementation with dual transport support
  - Added CORS headers for cross-origin requests
  - Improved logging with session tracking
  - Better error handling throughout request lifecycle

### Technical Details

#### Architecture Improvements

Following MCP best practices from official documentation:

- Tool definitions include clear descriptions and input schemas
- Session management prevents memory leaks with automatic cleanup
- Transport abstraction supports multiple client types
- Error handling provides meaningful feedback to clients

#### File Changes

- `src/streamable-http-server.ts` - Complete rewrite with StreamableHTTP support
- `src/index.ts` - Added enhanced instructions
- `README.md` - Comprehensive documentation updates
- `CHANGELOG.md` - This file

#### Testing

All changes tested with:

- Health endpoint verification
- Initialize request with session creation
- Tools listing with session reuse
- Proper session ID propagation
- All 26 tools remain functional

## [1.0.0] - 2025-11-19

### Initial Release

- 26 MCP tools covering Sveriges Radio API
- 4 resources with reference data
- 6 prompts for common workflows
- Bearer token authentication
- ETag-based caching
- TypeScript with full type safety
- SSE transport for remote connections
