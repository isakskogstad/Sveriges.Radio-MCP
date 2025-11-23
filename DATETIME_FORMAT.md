# Datum- och Tidsformat - Sveriges Radio MCP

**Rekommenderad standard:** ISO 8601 (UTC)

---

## 📅 Standardformat

### ISO 8601 UTC (Rekommenderat)

**Datum:**
```
2025-11-23
```

**Datum och tid:**
```
2025-11-23T08:00:00Z
2025-11-23T14:30:45.123Z
```

**Med timezone offset:**
```
2025-11-23T09:00:00+01:00  (svensk tid vinter)
2025-11-23T10:00:00+02:00  (svensk tid sommar)
```

---

## ✅ Korrekt användning

### Input-parametrar

När du skickar datum/tid till API-endpoints, använd:

```typescript
// Endast datum (för hela dagar)
startDateTime: "2025-11-23"
endDateTime: "2025-11-24"

// Datum och tid (för exakt tidpunkt)
startDateTime: "2025-11-23T08:00:00"
endDateTime: "2025-11-23T18:00:00"

// Med UTC-specifikation
startDateTime: "2025-11-23T08:00:00Z"
```

### Output-format

API:et returnerar timestamps i ISO 8601:

```json
{
  "timestamp": "2025-11-23T08:42:54.497Z",
  "publishdateutc": "2025-11-23T06:00:00Z",
  "starttimeutc": "2025-11-23T08:00:00Z",
  "endtimeutc": "2025-11-23T09:00:00Z"
}
```

---

## ⚠️ Äldre format (Ej rekommenderat)

### Microsoft-stil (används av vissa SR API-endpoints)

**Format:**
```
/Date(1763884800000)/
```

**Tolkning:**
- Numeriskt värde är Unix timestamp i millisekunder
- `/Date(1763884800000)/` = 2025-11-23T08:00:00.000Z

**Konvertering till ISO 8601:**
```typescript
function parseMicrosoftDate(msDate: string): string {
  const match = msDate.match(/\/Date\((\d+)\)\//);
  if (match) {
    const timestamp = parseInt(match[1]);
    return new Date(timestamp).toISOString();
  }
  return msDate;
}

// Exempel
parseMicrosoftDate("/Date(1763884800000)/")
// → "2025-11-23T08:00:00.000Z"
```

---

## 📖 Endpoint-guide

### Playlist-endpoints

```typescript
// get_channel_playlist
{
  channelId: 163,
  startDateTime: "2025-11-20",        // ✅ Endast datum
  endDateTime: "2025-11-23"           // ✅ Endast datum
}

// Alternativt med exakt tid
{
  channelId: 163,
  startDateTime: "2025-11-20T00:00:00",  // ✅ Datum + tid
  endDateTime: "2025-11-23T23:59:59"     // ✅ Datum + tid
}
```

### Schedule-endpoints

```typescript
// get_channel_schedule
{
  channelId: 132,
  date: "2025-11-23"  // ✅ ISO 8601 datum
}
```

### Episode-endpoints

Episoder returnerar UTC timestamps:

```json
{
  "publishdateutc": "2025-11-23T06:00:00Z",
  "availableuntilutc": "2025-12-23T23:59:59Z"
}
```

---

## 🌍 Tidszoner

### Sveriges Radio använder CET/CEST

- **CET** (Central European Time): UTC+1 (vinter)
- **CEST** (Central European Summer Time): UTC+2 (sommar)

### Konvertering

```typescript
// UTC → Svensk tid (approximation, beroende på DST)
function utcToSwedish(utcDateString: string): Date {
  const date = new Date(utcDateString);
  // Svensk tid är vanligtvis UTC+1 eller UTC+2
  return new Date(date.toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' }));
}

// Exempel
utcToSwedish("2025-11-23T08:00:00Z")
// → 2025-11-23 09:00:00 (svensk tid)
```

---

## 🔧 Bästa Praxis

### 1. Använd alltid ISO 8601 för nya implementationer

```typescript
// ✅ Bra
const date = new Date().toISOString()
// → "2025-11-23T08:42:54.497Z"

// ❌ Undvik
const date = "/Date(1763884800000)/"
```

### 2. Specifiera timezone när det är viktigt

```typescript
// ✅ Explicit UTC
"2025-11-23T08:00:00Z"

// ✅ Svensk tid med offset
"2025-11-23T09:00:00+01:00"

// ⚠️ Tvetydig (kan tolkas olika)
"2025-11-23T08:00:00"
```

### 3. Validera input

```typescript
function isValidISODate(dateString: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
  return isoDateRegex.test(dateString);
}

// Test
isValidISODate("2025-11-23")                    // ✅ true
isValidISODate("2025-11-23T08:00:00Z")         // ✅ true
isValidISODate("2025-11-23T08:00:00.123Z")     // ✅ true
isValidISODate("/Date(1763884800000)/")        // ❌ false
isValidISODate("23/11/2025")                   // ❌ false
```

### 4. Hantera båda formaten vid parsning (för bakåtkompatibilitet)

```typescript
function parseDateTime(input: string): Date {
  // Hantera Microsoft-format
  if (input.startsWith('/Date(')) {
    const match = input.match(/\/Date\((\d+)\)\//);
    if (match) {
      return new Date(parseInt(match[1]));
    }
  }

  // Hantera ISO 8601
  return new Date(input);
}
```

---

## 📊 Endpoints och deras datumformat

| Endpoint | Input-format | Output-format |
|----------|--------------|---------------|
| `get_playlist_rightnow` | - | ISO 8601 (`timestamp`) |
| `get_channel_playlist` | ISO 8601 (`startDateTime`, `endDateTime`) | ISO 8601 (`starttimeutc`, `stoptimeutc`) |
| `get_program_playlist` | ISO 8601 (`startDateTime`, `endDateTime`) | ISO 8601 (`starttimeutc`, `stoptimeutc`) |
| `get_episode_playlist` | - | ISO 8601 (`starttimeutc`, `stoptimeutc`) |
| `get_channel_schedule` | ISO 8601 (`date`) | ISO 8601 (`starttimeutc`, `endtimeutc`) |
| `list_episodes` | - | ISO 8601 (`publishdateutc`) |
| `get_episode` | - | ISO 8601 (`publishdateutc`, `availableuntilutc`) |
| `list_extra_broadcasts` | ISO 8601 (`date`) | Lokal tid (`localstarttime`, `localstoptime`) |

---

## 🚨 Vanliga problem

### Problem 1: Microsoft-format i gamla endpoints

**Symptom:**
```json
{
  "date": "/Date(1763884800000)/"
}
```

**Lösning:**
Konvertera till ISO 8601 (se konverteringsfunktion ovan)

---

### Problem 2: Tvetydig timezone

**Symptom:**
```
"2025-11-23T08:00:00"  // Är detta UTC eller lokal tid?
```

**Lösning:**
Lägg alltid till timezone-specifikation:
```
"2025-11-23T08:00:00Z"        // UTC
"2025-11-23T09:00:00+01:00"   // CET
```

---

### Problem 3: Felaktig datumformat i input

**Symptom:**
```
400 Bad Request: Invalid date format
```

**Lösning:**
Använd ISO 8601:
```typescript
// ❌ Fel
startDateTime: "23/11/2025"
startDateTime: "11-23-2025"

// ✅ Rätt
startDateTime: "2025-11-23"
startDateTime: "2025-11-23T00:00:00Z"
```

---

## 📚 Referenser

- [ISO 8601 Standard](https://en.wikipedia.org/wiki/ISO_8601)
- [MDN Date.toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- [Sveriges Radio API Documentation](https://api.sr.se/api/documentation/v2/)
- TESTING_REPORT.md - Problem 7: "Datum/tidsformat och timestampar"

---

**Uppdaterad:** 2025-11-23
**Relaterat:** TESTING_REPORT.md, Fas 2 - Konsistens
