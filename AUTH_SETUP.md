# 🔐 Bearer Token Authentication - Setup Guide

## ✅ Status: Färdigställd & Testad!

Din Sveriges Radio MCP Server har nu fullt fungerande Bearer token-autentisering.

---

## 🎯 Ditt Token

Ditt säkra token har genererats och finns i `.env`:

```
MCP_AUTH_TOKEN=NToDYQZVPx6u7KGfvNwF4abbZAQqefoxgZkPjKLysFg
```

**⚠️ VIKTIGT:**
- `.env` är i `.gitignore` och pushas INTE till GitHub
- Dela ALDRIG ditt token publikt
- För production: Använd environment variables i Render

---

## 🚀 Hur man använder

### 1. Lokal utveckling

**Starta servern:**
```bash
npm run start:streamable
```

**Testa health check (ingen auth):**
```bash
curl http://localhost:3000/health
```

**Anslut med Bearer token:**
```bash
curl -H "Authorization: Bearer NToDYQZVPx6u7KGfvNwF4abbZAQqefoxgZkPjKLysFg" \
  http://localhost:3000/sse
```

---

### 2. Lovable / AI Tool Integration

Konfigurera i Lovable:

```javascript
{
  "url": "http://localhost:3000/sse",
  "headers": {
    "Authorization": "Bearer NToDYQZVPx6u7KGfvNwF4abbZAQqefoxgZkPjKLysFg"
  }
}
```

---

### 3. Claude Desktop / MCP Client

Lägg till i Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sverigesradio": {
      "url": "http://localhost:3000/sse",
      "headers": {
        "Authorization": "Bearer NToDYQZVPx6u7KGfvNwF4abbZAQqefoxgZkPjKLysFg"
      }
    }
  }
}
```

---

### 4. Render Deployment (Production)

**Steg 1:** Gå till Render Dashboard → Environment

**Steg 2:** Lägg till environment variable:
```
MCP_AUTH_TOKEN=NToDYQZVPx6u7KGfvNwF4abbZAQqefoxgZkPjKLysFg
```

**Steg 3:** Använd din production URL:
```
https://sverigesradio-mcp.onrender.com/sse
```

---

## 🔍 Testresultat

Autentiseringen är **verifierad och fungerar**:

```
✅ Health check (no auth):     HTTP 200 OK
✅ MCP utan token:             HTTP 401 Unauthorized
✅ MCP med fel token:          HTTP 401 Unauthorized
✅ MCP med rätt token:         HTTP 200 OK (SSE stream)
```

---

## 🛡️ Säkerhet

### Vad är skyddat?
- ✅ `/sse` endpoint (MCP connection)
- ✅ `/mcp` endpoint (MCP connection)

### Vad är publikt?
- `/health` - Health check (visar inte känslig info)

### Best practices
1. **Rotera token regelbundet** (generera nytt med: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`)
2. **Använd HTTPS i production** (Render gör detta automatiskt)
3. **Olika tokens för dev/prod** (skapa `.env.production` för Render)

---

## 🔄 Regenerera Token

Om du behöver nytt token:

```bash
# Generera nytt token
node -e "console.log('MCP_AUTH_TOKEN=' + require('crypto').randomBytes(32).toString('base64url'))"

# Uppdatera .env med nya värdet
# Starta om servern
npm run start:streamable
```

---

## 📚 Teknisk Implementation

**Package:** `dotenv` (installerad)
**Fil:** `src/streamable-http-server.ts`
**Metod:** Bearer token via Authorization header

```typescript
import 'dotenv/config';  // Laddar .env automatiskt

const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

function authenticate(req: http.IncomingMessage): boolean {
  if (!AUTH_TOKEN) return true; // Public om ingen token

  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  return token === AUTH_TOKEN;
}
```

---

## ❓ Felsökning

### Problem: "authRequired: false" i health check
**Lösning:** `.env` laddas inte. Kontrollera att:
- `.env` finns i root-mappen
- `dotenv` är installerat (`npm install dotenv`)
- `import 'dotenv/config'` finns i `streamable-http-server.ts`

### Problem: 401 även med rätt token
**Lösning:** Kontrollera:
- Token matchar exakt (inga mellanslag)
- Header format: `Authorization: Bearer TOKEN`
- Servern har startats om efter `.env` ändrades

### Problem: SSE timeout
**Svar:** Detta är normalt! SSE är ett streaming-protokoll.
Använd MCP-klient istället för curl för att behålla connection.

---

## ✅ Checklista: Production-Ready

- [x] Token genererat
- [x] `.env` skapad (gitignored)
- [x] dotenv installerat
- [x] Import i streamable-http-server.ts
- [x] Autentisering testad lokalt
- [x] Kommit och pushat till GitHub
- [ ] Render environment variables konfigurerade
- [ ] Production endpoint testad

---

**🎉 Grattis! Din MCP Server är nu säker och redo för deployment!**

**Nästa steg:** Deploy till Render och uppdatera README med production URL.
