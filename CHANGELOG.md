# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### Roadmap (Future Enhancements)

#### OAuth 2.1 Authentication (Optional)
Planned for future release when user-specific access is needed:
- `GET /.well-known/oauth-protected-resource` - Resource metadata
- `GET /.well-known/oauth-authorization-server` - Auth server metadata
- `GET /authorize` - User login & consent
- `GET /callback` - Handle authorization code
- `POST /token` - Exchange code for access token
- `POST /register` - Dynamic client registration

**Note:** Not currently needed as Sveriges Radio API is public, but architecture is ready for expansion.

## [1.0.0] - 2025-11-19

### Initial Release
- 26 MCP tools covering Sveriges Radio API
- 4 resources with reference data
- 6 prompts for common workflows
- Bearer token authentication
- ETag-based caching
- TypeScript with full type safety
- SSE transport for remote connections
