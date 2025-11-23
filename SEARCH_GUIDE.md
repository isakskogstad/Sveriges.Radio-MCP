# Sökguide - Sveriges Radio MCP

Komplett guide för sökning i Sveriges Radios innehåll.

---

## 📋 Översikt

Sveriges Radio MCP erbjuder tre huvudsakliga sökverktyg:

1. **`search_programs`** - Sök i radioprogram
2. **`search_episodes`** - Sök i programavsnitt/podcasts
3. **`search_all`** - Global sökning över program, avsnitt och kanaler

---

## 🔍 search_programs

Sök efter radioprogram baserat på namn, beskrivning eller kategori.

### Parametrar

| Parameter | Typ | Obligatorisk | Beskrivning |
|-----------|-----|--------------|-------------|
| `query` | string | ✅ Ja | Sökterm (1-200 tecken) |
| `categoryId` | number | ❌ Nej | Filtrera på programkategori-ID |
| `hasOnDemand` | boolean | ❌ Nej | Filtrera på program med on-demand (podcast) |
| `page` | number | ❌ Nej | Sidnummer (min: 1) |
| `size` | number | ❌ Nej | Resultat per sida (min: 1, max: 100) |

### Default-beteende

```typescript
{
  hasOnDemand: undefined,  // Söker i ALLA program (både live och on-demand)
  page: 1,
  size: 10
}
```

### Exempel

**Exempel 1: Enkelsökning**
```typescript
search_programs({
  query: "Ekot"
})
// Söker efter program som matchar "Ekot" i namn eller beskrivning
```

**Exempel 2: Filtrera på kategori**
```typescript
search_programs({
  query: "nyheter",
  categoryId: 1  // Kategori: Nyheter
})
```

**Exempel 3: Endast podcasts**
```typescript
search_programs({
  query: "historia",
  hasOnDemand: true  // Endast program med podcast
})
```

### Vanliga problem

**Problem: "Ekot" gav inga resultat**

**Orsak:** Default-filtrering kan utesluta vissa program.

**Lösning:**
```typescript
// Testa olika varianter
search_programs({ query: "Ekot" })
search_programs({ query: "Ekot", hasOnDemand: false })
search_programs({ query: "Ekot", hasOnDemand: true })

// Alternativt: Använd search_all istället
search_all({ query: "Ekot" })
```

---

## 📻 search_episodes

Sök efter programavsnitt/podcasts baserat på titel, beskrivning eller innehåll.

### Parametrar

| Parameter | Typ | Obligatorisk | Beskrivning |
|-----------|-----|--------------|-------------|
| `query` | string | ✅ Ja | Sökterm (1-200 tecken) |
| `channelId` | number | ❌ Nej | Filtrera på kanal-ID |
| `programId` | number | ❌ Nej | Filtrera på program-ID |
| `page` | number | ❌ Nej | Sidnummer (min: 1) |
| `size` | number | ❌ Nej | Resultat per sida (min: 1, max: 100) |

### Default-beteende

```typescript
{
  page: 1,
  size: 10
}
```

### Exempel

**Exempel 1: Fulltextsök**
```typescript
search_episodes({
  query: "klimatförändring"
})
// Söker i alla avsnitt efter "klimatförändring"
```

**Exempel 2: Sök inom specifikt program**
```typescript
search_episodes({
  query: "intervju",
  programId: 4540  // Exempel: Ekot
})
```

**Exempel 3: Sök på specifik kanal**
```typescript
search_episodes({
  query: "dokumentär",
  channelId: 132  // P1
})
```

### Tips

- **Bred sökning först:** Börja med en bred sökning utan filter
- **Förfina med filter:** Lägg till channelId/programId för att begränsa resultat
- **Använd exakta termer:** Sök på exakta namn/termer för bättre precision

---

## 🌐 search_all

Global sökning över program, avsnitt och kanaler samtidigt.

### Parametrar

| Parameter | Typ | Obligatorisk | Beskrivning |
|-----------|-----|--------------|-------------|
| `query` | string | ✅ Ja | Sökterm (1-200 tecken) |
| `searchIn` | enum | ❌ Nej | Var ska det sökas: 'programs', 'episodes', 'channels', 'all' |
| `limit` | number | ❌ Nej | Max resultat per kategori (min: 1, max: 50) |

### Default-beteende

```typescript
{
  searchIn: 'all',   // Söker i programs, episodes OCH channels
  limit: 10          // Max 10 resultat per kategori
}
```

### Exempel

**Exempel 1: Global sökning**
```typescript
search_all({
  query: "Ekot"
})
// Returnerar: { programs: [...], episodes: [...], channels: [...] }
```

**Exempel 2: Sök endast i program**
```typescript
search_all({
  query: "sport",
  searchIn: "programs"
})
// Returnerar endast: { programs: [...] }
```

**Exempel 3: Öka antal resultat**
```typescript
search_all({
  query: "nyheter",
  limit: 50  // Max 50 resultat per kategori
})
```

### Respons-format

```json
{
  "query": "Ekot",
  "searchIn": "all",
  "results": {
    "programs": [
      { "id": 4540, "name": "Ekot", ... }
    ],
    "episodes": [
      { "id": 123456, "title": "Ekot 2025-11-23 08:00", ... }
    ],
    "channels": [
      { "id": 132, "name": "P1", ... }
    ]
  },
  "totalResults": 15
}
```

---

## 📊 Jämförelse av sökverktyg

| Verktyg | Söker i | Bäst för | Filter |
|---------|---------|----------|--------|
| `search_programs` | Program | Hitta radioprogram efter namn/kategori | categoryId, hasOnDemand |
| `search_episodes` | Avsnitt | Hitta specifika avsnitt/podcasts | channelId, programId |
| `search_all` | Program + Avsnitt + Kanaler | Bred sökning när du inte vet var innehållet finns | searchIn |

---

## 🎯 Bästa Praxis

### 1. Välj rätt sökverktyg

```typescript
// Letar efter ett program? → search_programs
search_programs({ query: "Sommar i P1" })

// Letar efter ett specifikt avsnitt? → search_episodes
search_episodes({ query: "intervju med statsministern" })

// Vet inte var det finns? → search_all
search_all({ query: "statsministern" })
```

### 2. Använd filter för precision

```typescript
// Dåligt: Bred sökning ger för många resultat
search_episodes({ query: "nyheter" })

// Bättre: Filtrera på program
search_episodes({
  query: "nyheter",
  programId: 4540  // Ekot
})
```

### 3. Hantera tomma resultat

```typescript
// Testa först med search_all
const allResults = await search_all({ query: "Min Sökterm" });

if (allResults.totalResults === 0) {
  // Testa med bredare sökning eller synonymer
  const broader = await search_all({ query: "Synonym" });
}

// Om fortfarande inga resultat → innehållet kanske inte finns
```

### 4. Paginering för stora resultat

```typescript
// Första sidan
search_programs({ query: "musik", page: 1, size: 20 })

// Andra sidan
search_programs({ query: "musik", page: 2, size: 20 })

// Använd pagination i response för att navigera
```

---

## ⚠️ Vanliga Problem och Lösningar

### Problem 1: "Inga resultat för känt program"

**Symptom:**
```typescript
search_programs({ query: "Ekot" })
// Returnerar: { programs: [], pagination: {...} }
```

**Orsaker:**
- Default-filtrering kan utesluta vissa program
- Programmet kan vara arkiverat eller inte ha on-demand
- Sökindex kan vara annorlunda än förväntat

**Lösningar:**

**Lösning A: Använd search_all**
```typescript
search_all({ query: "Ekot" })
// Bredare sökning över alla kategorier
```

**Lösning B: Testa olika filter**
```typescript
search_programs({ query: "Ekot", hasOnDemand: false })
search_programs({ query: "Ekot", hasOnDemand: true })
```

**Lösning C: Använd list-verktyg istället**
```typescript
list_news_programs()  // Listar alla nyhetsprogram
// Sedan filtrera manuellt
```

---

### Problem 2: "För många resultat"

**Symptom:**
```typescript
search_episodes({ query: "intervju" })
// Returnerar: 1000+ resultat
```

**Lösningar:**

**1. Använd mer specifik sökterm**
```typescript
search_episodes({ query: "intervju med klimatforskare" })
```

**2. Filtrera på program eller kanal**
```typescript
search_episodes({
  query: "intervju",
  programId: 4540  // Bara Ekot
})
```

**3. Använd datumfilter (om tillgängligt)**
```typescript
list_episodes({
  programId: 4540,
  fromDate: "2025-11-01",
  toDate: "2025-11-23"
})
// Sedan filtrera på klientsidan
```

---

### Problem 3: "Inkonsekvent sökbeteende"

**Symptom:**
- `search_programs("X")` ger olika resultat än `search_all("X")`
- Samma sökterm ger olika resultat vid olika tidpunkter

**Orsaker:**
- Olika sökindex för olika endpoints
- Cache-uppdateringar
- Default-filtrering skiljer sig åt

**Lösningar:**

**1. Använd search_all för konsistens**
```typescript
// Mest konsekvent
const results = await search_all({
  query: "min sökterm",
  searchIn: "all"
});
```

**2. Explicit filtrering**
```typescript
// Ange alltid hasOnDemand explicit
search_programs({
  query: "X",
  hasOnDemand: true  // Explicit: endast podcasts
})
```

---

### Problem 4: "Sökterm för lång eller ogiltig"

**Symptom:**
```
Error: Search query cannot exceed 200 characters
```

**Lösning:**
```typescript
// Kapa söktermen
const query = longQuery.substring(0, 200);
search_episodes({ query });

// Eller dela upp i flera sökningar
const keywords = ["keyword1", "keyword2"];
const results = await Promise.all(
  keywords.map(kw => search_episodes({ query: kw }))
);
```

---

## 🔢 Programkategorier

Använd med `search_programs({ categoryId: ... })`:

| ID | Kategori |
|----|----------|
| 1 | Nyheter |
| 2 | Sport |
| 3 | Musik |
| 4 | Kultur & underhållning |
| 5 | Dokumentär & rapportering |
| 6 | Livsstil |
| 7 | Barn |
| 8 | Humor |
| 9 | Samhälle & debatt |
| 10 | Drama |
| 11 | Vetenskap |
| 12 | Övrigt |

**Hämta aktuell lista:**
```typescript
list_program_categories()
```

---

## 💡 Optimeringstips

### 1. Cacha sökresultat

```typescript
// Undvik att söka om samma term flera gånger
const cache = new Map();

async function cachedSearch(query) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  const results = await search_all({ query });
  cache.set(query, results);
  return results;
}
```

### 2. Använd debouncing för realtidssökning

```typescript
// Vänta tills användaren slutat skriva
let searchTimeout;
function onSearchInput(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    search_all({ query });
  }, 300); // 300ms debounce
}
```

### 3. Parallel sökning för bättre UX

```typescript
// Sök i flera kategorier parallellt
const [programs, episodes] = await Promise.all([
  search_programs({ query: "musik" }),
  search_episodes({ query: "musik" })
]);
```

---

## 📚 Relaterade Verktyg

För mer specifika behov, använd:

- **`list_programs`** - Lista alla program (med filter)
- **`list_episodes`** - Lista avsnitt för program (med datumfilter)
- **`list_news_programs`** - Lista alla nyhetsprogram
- **`list_program_categories`** - Hämta alla kategorier

---

## 📎 Relaterade Dokument

- [README.md](README.md) - Projektöversikt
- [TESTING_REPORT.md](TESTING_REPORT.md) - Testrapport och implementeringsstatus
- [DATETIME_FORMAT.md](DATETIME_FORMAT.md) - Datum/tid-format guide

---

**Skapad:** 2025-11-23
**Uppdaterad:** 2025-11-23 (Fas 3)
**Nästa review:** Vid API-uppdateringar eller användarfeedback
