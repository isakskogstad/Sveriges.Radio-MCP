# Sveriges Radio MCP - Testrapport
**Datum:** 2025-11-23
**Testare:** Användare
**Version:** 1.0 (efter PR #4)

---

## 📋 Sammanfattning

Omfattande testning av sr_mcp:s verktyg/endpoints har genomförts. Detta dokument innehåller:
- Lista över testade verktyg
- Identifierade brister, fel och inkonsekvenser
- Konkreta förbättringsförslag
- Prioriterad åtgärdsplan

---

## ✅ Testade Verktyg (Urval)

### Real-time & Live
- `list_channels`
- `get_channel_rightnow`
- `get_all_rightnow`
- `get_playlist_rightnow`
- `get_channel_schedule`

### Program & Episoder
- `get_program`
- `get_program_schedule`
- `get_program_broadcasts`
- `get_program_playlist`
- `list_program_categories`
- `list_broadcasts`

### Podcast & Audio
- `list_podfiles`
- `get_podfile`
- `list_episodes`
- `get_episode`
- `get_episodes_batch`
- `get_latest_episode`
- `get_episode_playlist`

### Spellistor
- `get_channel_playlist`
- `get_program_playlist`
- `get_episode_playlist`

### Sökning
- `search_programs`
- `search_episodes`
- `search_all`

### Nyheter
- `list_news_programs`
- `get_latest_news_episodes`
- `get_recently_published`
- `get_top_stories`

### Trafik
- `get_traffic_areas`
- `get_traffic_messages`

### Sändningar
- `list_extra_broadcasts`

### Audio Templates
- `list_ondemand_audio_templates`
- `list_live_audio_templates`

---

## 🐛 Identifierade Brister och Fel

### 1. Endpoint returnerar `null` istället för strukturerad tom lista

**Verktyg:** `get_playlist_rightnow`
**Exempel:** Anrop för kanalId 164 och 132

**Resultat:**
```json
{
  "currentSong": null,
  "nextSong": null,
  "previousSong": null,
  "channel": null,
  "timestamp": "2025-11-23T08:42:54.497Z"
}
```

**Problem:**
- Oklart om detta betyder "ingen låtmetadata för talkanal" eller ett faktiskt fel
- Saknas fält som anger "not applicable" eller "no metadata available"

**Påverkan:**
- Klienter måste implementera extra logik för att skilja mellan faktiskt tomt svar och fel
- Sämre developer experience

**Rekommendation:**
```json
{
  "currentSong": null,
  "nextSong": null,
  "previousSong": null,
  "channel": { "id": 164, "name": "P1" },
  "metadata": {
    "hasMusicMetadata": false,
    "reason": "speech_channel"
  },
  "timestamp": "2025-11-23T08:42:54.497Z"
}
```

---

### 2. Inkonsistent representation av tomma resultat

**Verktyg:** `get_program_playlist`, `get_episode_playlist` vs `get_playlist_rightnow`

**Problem:**
- Vissa endpoints returnerar `"songs": []` (tom array) för talprogram
- Andra returnerar `null`-fält
- Varierande representation för "inga låtar"

**Påverkan:**
- Klienter måste hantera både `null` och `[]` för samma koncept
- Inkonsekvent API-design

**Rekommendation:**
- Standardisera på **tom array** `[]` för "inga resultat"
- Använd `null` endast för fält som är genuint optional
- Lägg till metadata-fält: `hasMusicMetadata: boolean`

---

### 3. Felaktig HTTP-statuskod 404 för giltiga anrop

**Verktyg:** `get_channel_playlist`
**Exempel:** `channelId=164` med datum

**Resultat:**
```
404 NOT_FOUND
SRAPIError: NOT_FOUND ... url=...&id=164&startdatetime=...
```

**Problem:**
- 404 används för "ingen data" istället för "resource not found"
- Anropet var giltigt (kanal-id existerar)
- Oklart om det är ett fel eller bara tomt resultat

**Påverkan:**
- Klienter kan inte skilja mellan "ogiltigt ID" och "inga låtar för perioden"
- Svårt att implementera korrekt error handling och retry-logik

**Rekommendation:**
- **200 OK** med tom array om inget resultat för valt tidsintervall
- **204 No Content** som alternativ
- **404** endast vid genuint ogiltigt channel-id
- Förbättrat felmeddelande: `"No playlist data available for channel 164 in specified time range"`

---

### 4. Tomma audio-template listor

**Verktyg:** `list_ondemand_audio_templates`, `list_live_audio_templates`

**Resultat:**
```json
{
  "templates": [],
  "description": "..."
}
```

**Problem:**
- Mallar är byggstenar för klienter att generera audio-URLs
- Tom lista utan förklaring
- Omöjligt för integratörer att automatiskt bygga korrekta audio-URLs

**Påverkan:**
- Klienter kan inte använda endpoints för sitt avsedda syfte
- Manual hårdkodning av URL-mönster krävs

**Rekommendation:**
Returnera faktiska mallar:

```json
{
  "templates": [
    {
      "type": "ondemand",
      "format": "mp3",
      "quality": "high",
      "template": "https://www.sverigesradio.se/topsy/ljudfil/srapi/{audioId}.mp3",
      "parameters": {
        "audioId": "integer - Audio file ID from episode/broadcast"
      }
    },
    {
      "type": "ondemand",
      "format": "m4a",
      "quality": "high",
      "template": "https://www.sverigesradio.se/topsy/ljudfil/srapi/{audioId}-hi.m4a",
      "parameters": {
        "audioId": "integer - Audio file ID from episode/broadcast"
      }
    }
  ],
  "description": "Templates for constructing on-demand audio URLs"
}
```

---

### 5. Inkonsekvent sökbeteende

**Verktyg:** `search_programs`, `search_all`, `list_news_programs`

**Problem:**
- `search_programs(query="Ekot")` gav initialt inga träffar
- `search_all` och `list_news_programs` visade Ekot-data
- Olika default-filtrering eller olika sökindex

**Påverkan:**
- Oförutsägbara sökresultat
- Användare missar relevant innehåll

**Rekommendation:**
- Dokumentera alla default-parametrar (t.ex. `hasOnDemand` default)
- Konsekvent indexering över alla sökendpoints
- Tydlig dokumentation om skillnader mellan `search_programs` och `search_all`

---

### 6. Felaktig hantering av `categoryId=0`

**Verktyg:** `list_program_categories`

**Problem:**
- `categoryId=0` ger 404 NOT_FOUND
- Parametern bör vara optional
- 0 bör behandlas som "ej angiven" eller valideras med 400 Bad Request

**Påverkan:**
- Klientskript som skickar 0 som default får 404

**Rekommendation:**
- Gör `categoryId` optional
- Om 0 skickas: behandla som "lista alla kategorier"
- Alternativt: validera och returnera 400 med tydligt felmeddelande

---

### 7. Varierande tids-/datumformat

**Problem:**
- Timestamps använder `/Date(1763884800000)/` (Microsoft-format)
- Andra endpoints använder ISO-liknande strings
- Inkonsekvent parsning krävs

**Exempel:**
```json
{
  "date": "/Date(1763884800000)/",  // Microsoft format
  "timestamp": "2025-11-23T08:42:54.497Z"  // ISO 8601
}
```

**Påverkan:**
- Ökad komplexitet i klientkod
- Felrisk vid parsning

**Rekommendation:**
- **Standardisera på ISO 8601 UTC:** `2025-11-23T08:00:00Z`
- Migrera bort från `/Date(...)/`-format
- Om bakåtkompatibilitet krävs: stöd både men markera Microsoft-format som deprecated

---

### 8. Inkonsistent pagination

**Problem:**
- Olika endpoints returnerar pagination olika
- Vissa har `nextpage`-länk, andra inte
- Vissa har `page`/`size`/`totalhits`, andra `totalpages`

**Påverkan:**
- Klienter måste implementera specialfall per endpoint

**Rekommendation:**
Standardiserad pagination-modell:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalHits": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "nextPageUrl": "https://..."
  }
}
```

---

### 9. Otydliga felmeddelanden

**Problem:**
- 404 NOT_FOUND innehåller URL men inte alltid användbar `errorCode`/`message`
- Oklart vad som saknas (t.ex. "no playlist for time interval" vs "invalid id")

**Påverkan:**
- Svårt att debugga och hantera fel programmatiskt

**Rekommendation:**
Standardiserat felobjekt:
```json
{
  "error": {
    "code": "NO_PLAYLIST_DATA",
    "message": "No playlist data available for the specified time range",
    "details": {
      "channelId": 164,
      "startDateTime": "2025-11-16T00:00:00Z",
      "endDateTime": "2025-11-16T23:59:59Z"
    },
    "httpStatus": 404,
    "timestamp": "2025-11-23T08:42:54.497Z"
  }
}
```

---

### 10. Saknad metadata om musikinnehåll

**Verktyg:** `get_program_playlist`, `get_episode_playlist`, `get_channel_playlist`

**Problem:**
- Ofta tomma för talprogram (förväntat)
- Ingen metadata som anger att endpoint inte är applicerbart
- Klienter vet inte om det är meningsfullt att anropa playlist-endpoints

**Påverkan:**
- Onödiga API-anrop
- Sämre user experience

**Rekommendation:**
Lägg till metadata i program/episode-objekt:
```json
{
  "id": 12345,
  "name": "Ekot",
  "contentType": "speech",
  "hasMusicMetadata": false
}
```

---

### 11. Bristfällig parametervalidering

**Problem:**
- Vissa endpoints ger 404 vid felaktiga parametrar istället för 400
- Tomt svar istället för valideringsfel

**Påverkan:**
- Svårt att debugga
- Dålig developer experience

**Rekommendation:**
- Validera inkommande parametrar
- Returnera **400 Bad Request** med förklarande meddelande
- Exempel: `"Parameter 'startDateTime' must be in ISO 8601 format"`

---

### 12. Batch-anrop saknar partial success

**Verktyg:** `get_episodes_batch`

**Problem:**
- Fungerar men bör dokumentera max antal IDs
- Saknar hantering för out-of-range IDs med delvis svar

**Påverkan:**
- Fail-all vid en ogiltig ID
- Ineffektivt för stora batch-operationer

**Rekommendation:**
```json
{
  "success": true,
  "results": [
    { "id": 123, "data": {...} },
    { "id": 456, "data": {...} }
  ],
  "errors": [
    { "id": 789, "error": "Episode not found" }
  ],
  "metadata": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

---

### 13. Blandning av channel/program IDs

**Verktyg:** `search_all`

**Problem:**
- Objekt med `id=4540` som channel-id men med liveaudio-URL som tyder på program-id
- Semantisk förvirring mellan kanal och program

**Påverkan:**
- Klienter som antar semantics kan tolka fel

**Rekommendation:**
- Tydlig fält-naming: `channelId` vs `programId`
- Lägg till `type`-fält: `"channel"` eller `"program"`
- Separata ID-domäner eller prefix

---

### 14. Variation i playback URL-format

**Problem:**
- Vissa broadcast-filer: `.mp3` direkt
- Andra: `-hi.m4a`
- Vissa: meta-URL (`api/radio.aspx?type=broadcast...`)

**Påverkan:**
- Svårt att förutsäga URL-format
- Klienter måste hantera flera format

**Rekommendation:**
- Standardisera i mallar
- Tillhandahåll enkla direkta URL-fält för streaming:
```json
{
  "audioUrls": {
    "high": "https://.../.../file-hi.mp3",
    "medium": "https://.../.../file-med.mp3",
    "low": "https://.../.../file-low.mp3"
  }
}
```

---

### 15. Trafik-endpoints ej fullt testade

**Status:**
- `get_traffic_areas` returnerade full lista ✅
- `get_traffic_messages` ej körd med specifikt area name

**Rekommendation:**
- Testa med konkreta områdesnamn
- Validera koordinater och geografisk data

---

## 🎯 Konkreta Förbättringsförslag

### 1. Standardisera tomma resultat ⭐⭐⭐⭐⭐
**Prioritet: KRITISK**

**Åtgärd:**
- Bestäm standardmönster: **alltid 200 + tom array** eller **204 No Content**
- Undvik `null` på vissa fält och `[]` på andra
- Implementera konsekvent över alla endpoints

**Exempel:**
```typescript
// Före
{ currentSong: null, channel: null }

// Efter
{
  currentSong: null,
  channel: { id: 164, name: "P1" },
  metadata: {
    hasMusicMetadata: false,
    reason: "speech_channel"
  }
}
```

---

### 2. Förbättra felkoder och felobjekt ⭐⭐⭐⭐⭐
**Prioritet: KRITISK**

**Åtgärd:**
- Använd rätt HTTP-status:
  - **400** för felaktiga parametrar
  - **404** för verkligt ej-existerande resurs
  - **500** för serverfel
  - **200** för lyckad förfrågan med tomt resultat
- Standardisera felobjekt med `code`, `message`, `details`, `httpStatus`

**Implementation:**
```typescript
interface StandardError {
  error: {
    code: string;           // Maskinläsbar kod
    message: string;        // Människoläsbar text
    details?: object;       // Extra kontext
    httpStatus: number;     // HTTP-status
    timestamp: string;      // ISO 8601
  };
}
```

---

### 3. Fyll på audio-template endpoints ⭐⭐⭐⭐⭐
**Prioritet: KRITISK**

**Åtgärd:**
- `list_ondemand_audio_templates` ska returnera användbara mallar
- `list_live_audio_templates` ska returnera live-streaming mallar
- Dokumentera placeholders och parametrar

**Implementation:**
```typescript
const ondemandTemplates = [
  {
    type: "ondemand",
    format: "mp3",
    quality: "high",
    template: "https://www.sverigesradio.se/topsy/ljudfil/srapi/{audioId}.mp3",
    parameters: { audioId: "Audio file ID from episode" }
  },
  {
    type: "ondemand",
    format: "m4a",
    quality: "high",
    template: "https://www.sverigesradio.se/topsy/ljudfil/srapi/{audioId}-hi.m4a",
    parameters: { audioId: "Audio file ID from episode" }
  }
];
```

---

### 4. Konsekvent tidsformat ⭐⭐⭐⭐
**Prioritet: HÖG**

**Åtgärd:**
- Migrera till **ISO 8601 (UTC)** för alla datum/tidfält
- Ta bort `/Date(...)/`-format
- Dokumentera övergångsperiod om bakåtkompatibilitet krävs

**Format:**
```
2025-11-23T08:00:00Z  ✅
2025-11-23T08:00:00.000Z  ✅
/Date(1763884800000)/  ❌ (deprecated)
```

---

### 5. Förbättrad dokumentation av sökparametrar ⭐⭐⭐⭐
**Prioritet: HÖG**

**Åtgärd:**
- Dokumentera defaults (t.ex. `hasOnDemand` default = false)
- Förklara vilka fält som filtrerar bort resultat
- Ge konkreta exempel på vanliga sökningar

---

### 6. Klargör semantik för playlist endpoints ⭐⭐⭐⭐
**Prioritet: HÖG**

**Åtgärd:**
- Lägg till `hasMusicMetadata` i program/episode metadata
- Om program är tal/podd: returnera **200 + songs: []** samt `hasMusic=false`
- Dokumentera vilka program-typer som har musik-metadata

---

### 7. Robust pagination-API ⭐⭐⭐
**Prioritet: MEDEL**

**Åtgärd:**
- Standardisera pagination-modell
- Använd konsekvent: `page`, `pageSize`, `totalHits`, `totalPages`, `nextPageUrl`
- Dokumentera max-size per sida

---

### 8. Batch-anrop: Partial success handling ⭐⭐⭐
**Prioritet: MEDEL**

**Åtgärd:**
- `get_episodes_batch` bör returnera per-id status
- Returnera delvis lyckat svar istället för fail-all
- Dokumentera max antal IDs per batch

---

### 9. Konsistent kanal/program-identifiering ⭐⭐⭐
**Prioritet: MEDEL**

**Åtgärd:**
- Skilj tydligt på `channelId` och `programId` i alla svar
- Lägg till `type`-fält där relevant
- Undvik ID-kollisioner mellan olika entiteter

---

### 10. Testfall & Monitoring ⭐⭐
**Prioritet: LÅG (men viktig långsiktigt)**

**Åtgärd:**
- Skapa automatiserade integrationstester
- Kör dagligen över kritiska endpoints
- Larma vid 404/500 eller strukturförändringar
- CI/CD integration

---

## 📊 Prioriterad Åtgärdsplan

### Fas 1: Kritiska Fixes (v1.1)
1. ✅ Fixa audio templates (list_ondemand_audio_templates, list_live_audio_templates)
2. ✅ Standardisera tomma resultat (null → [] + metadata)
3. ✅ Förbättra felhantering (404 → 200/204 där applicerbart)
4. ✅ Lägg till `hasMusicMetadata` i program/episode responses

### Fas 2: Konsistens (v1.2)
5. Standardisera tidsformat (ISO 8601)
6. Standardisera pagination
7. Förbättra felmeddelanden (StandardError interface)

### Fas 3: Förbättringar (v1.3)
8. Batch partial success
9. Förbättrad parametervalidering
10. Dokumentation av sökparametrar

### Fas 4: Långsiktig Stabilitet (v2.0)
11. Automatiserade tester
12. Monitoring & alerting
13. API-versionering

---

## 📝 Specifika Exempel på Problem

### Problem 1: get_playlist_rightnow (channelId=164)
```json
// Aktuellt svar
{
  "currentSong": null,
  "channel": null,
  "timestamp": "2025-11-23T08:42:54.497Z"
}

// Önskat svar
{
  "currentSong": null,
  "nextSong": null,
  "previousSong": null,
  "channel": {
    "id": 164,
    "name": "P1"
  },
  "metadata": {
    "hasMusicMetadata": false,
    "reason": "speech_channel",
    "contentType": "speech"
  },
  "timestamp": "2025-11-23T08:42:54.497Z"
}
```

### Problem 2: get_channel_playlist (404 för giltigt anrop)
```
Anrop: channelId=164, startDateTime=2025-11-16, endDateTime=2025-11-16
Resultat: 404 NOT_FOUND
Önskat: 200 OK med {"songs": [], "metadata": {"reason": "no_data_for_interval"}}
```

### Problem 3: list_ondemand_audio_templates
```json
// Aktuellt svar
{
  "templates": [],
  "description": "Templates for on-demand audio"
}

// Önskat svar (se sektion 3 ovan)
```

### Problem 4: Blandade tidsformat
```
/Date(1763884800000)/  ❌
2025-11-23T08:42:54.497Z  ✅
```

### Problem 5: search_programs("Ekot") gav inga träffar
```
Sökväg: search_programs med query="Ekot"
Resultat: 0 träffar (trots att Ekot existerar)
list_news_programs: Visar Ekot
Problem: Inkonsekvent sökindex eller default-filtrering
```

---

## 🔍 Testmetodik

**Testperiod:** 2025-11-23
**Testmiljö:** Produktion (SR API v2)
**Testverktyg:** Claude Code MCP client
**Omfattning:** ~30 endpoints testade

**Testfall:**
- ✅ Lyckade anrop med giltiga parametrar
- ✅ Edge cases (talprogram, inga låtar, tomma intervall)
- ✅ Felhantering (ogiltiga IDs, felaktiga parametrar)
- ✅ Sökning (olika queries och parametrar)
- ✅ Real-time data (rightnow, live)
- ⚠️ Batch-operationer (begränsad testning)
- ⚠️ Trafik-endpoints (delvis testade)

---

## 💡 Slutsatser

Sveriges Radio MCP är i grunden **funktionellt och användbart**, men lider av:
1. **Inkonsekvent API-design** (null vs [], 404 vs 200)
2. **Saknade mallar** för audio-URL konstruktion
3. **Otydliga felmeddelanden** och HTTP-statuskoder
4. **Varierande tidsformat**
5. **Saknad metadata** för content-type (musik vs tal)

De flesta problemen är **lätta att åtgärda** och kräver inga stora arkitektoniska ändringar. Genom att implementera förslagen i Fas 1-2 kommer API:et bli:
- ✅ Mer robust
- ✅ Lättare att integrera
- ✅ Tydligare dokumentation
- ✅ Bättre developer experience

---

---

## ✅ Implementeringsstatus

### Fas 1: Kritiska Fixes (v1.1) - ✅ KLAR

**Datum:** 2025-11-23
**Commit:** 07f6548

1. ✅ **Audio templates fixade**
   - `list_ondemand_audio_templates` returnerar nu faktiska mallar (mp3, m4a hi/med/low)
   - `list_live_audio_templates` returnerar live-streaming mallar
   - Dokumenterade placeholders och exempel

2. ✅ **Playlist null-hantering förbättrad**
   - `get_playlist_rightnow` har nu metadata (hasMusicMetadata, contentType, reason)
   - Channel-fält aldrig null (fallback till {id, name: 'Unknown'})

3. ✅ **Felhantering för playlist-endpoints**
   - `get_channel_playlist`: 200 + tom array istället för 404
   - `get_program_playlist`: 200 + tom array istället för 404
   - `get_episode_playlist`: 200 + tom array istället för 404
   - Alla har metadata med count och hasMusicMetadata

4. ✅ **Standardiserade tomma resultat**
   - Konsekvent användning av `[]` istället för null
   - Metadata-objekt i alla responses

### Fas 2: Konsistens (v1.2) - ✅ KLAR

**Datum:** 2025-11-23

1. ✅ **StandardError interface**
   - Ny `StandardErrorResponse` interface med code, message, details, httpStatus, timestamp
   - Förbättrade felmeddelanden med suggestions
   - Hantering av 400, 404, 429, 500+ med tydliga meddelanden
   - AbortError och network errors bättre hanterade

2. ✅ **Standardiserad pagination**
   - Ny `StandardPagination` interface
   - `normalizePagination()` helper-funktion
   - Konvertering från SR:s format till standardformat
   - Konsekvent: page, pageSize, totalHits, totalPages, hasNextPage, hasPreviousPage

3. ✅ **Tidsformat-dokumentation**
   - Ny fil: `DATETIME_FORMAT.md`
   - ISO 8601 rekommendationer
   - Konvertering från Microsoft-format
   - Endpoint-guide med exempel
   - Timezone-hantering (CET/CEST)

### Fas 3: Förbättringar (v1.3) - 🔄 PLANERAD

1. ⏳ Batch partial success handling
2. ⏳ Förbättrad parametervalidering
3. ⏳ Dokumentation av sökparametrar

### Fas 4: Långsiktig Stabilitet (v2.0) - 📅 FRAMTIDA

1. 📅 Automatiserade tester
2. 📅 Monitoring & alerting
3. 📅 API-versionering

---

## 📎 Relaterade Dokument

- [README.md](README.md) - Projektöversikt
- [CHANGELOG.md](CHANGELOG.md) - Versionshistorik
- [AUTH_SETUP.md](AUTH_SETUP.md) - Autentiseringsguide
- [DATETIME_FORMAT.md](DATETIME_FORMAT.md) - Datum/tid-format guide

---

**Skapad:** 2025-11-23
**Uppdaterad:** 2025-11-23 (Fas 2 implementerad)
**Nästa review:** Efter implementering av Fas 3
