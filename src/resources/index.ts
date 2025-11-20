/**
 * MCP Resources - Sveriges Radio Reference Data
 * 4 resources providing quick reference information
 */

export const allResources = [
  {
    uri: 'sr://api/info',
    name: 'Sveriges Radio API Information',
    description: 'API version, base URL, capabilities, and usage information',
    mimeType: 'application/json',
  },
  {
    uri: 'sr://channels/all',
    name: 'Complete Channel List',
    description: 'All SR channels with IDs, names, and types for quick reference',
    mimeType: 'application/json',
  },
  {
    uri: 'sr://audio/quality-guide',
    name: 'Audio Quality & Formats Guide',
    description: 'Audio quality levels, streaming formats, and usage recommendations',
    mimeType: 'application/json',
  },
  {
    uri: 'sr://categories/programs',
    name: 'Program Categories Reference',
    description: 'All program categories with IDs (Nyheter, Musik, Sport, etc.)',
    mimeType: 'application/json',
  },
];

// Resource content generators
export const resourceContents: Record<string, () => any> = {
  'sr://api/info': () => ({
    name: 'Sveriges Radio Open API',
    version: 'v2',
    baseUrl: 'https://api.sr.se/api/v2',
    authentication: 'None (public API)',
    formats: ['json', 'xml', 'jsonp'],
    caching: {
      enabled: true,
      method: 'HTTP ETags (304 Not Modified)',
      levels: {
        veryShort: '< 1 minute',
        short: '~5 minutes',
        medium: '~30 minutes',
        long: '~2 hours',
        veryLong: '~12 hours',
      },
    },
    rateLimits: {
      note: 'No official rate limits published, but be respectful',
      recommendation: 'Cache responses and avoid excessive requests',
    },
    status: {
      maintenance: 'Maintained but not actively developed',
      stability: 'Stable - API has been running for years',
      availability: 'Available until further notice',
    },
    documentation: 'https://api.sr.se/api/documentation/v2/',
    support: {
      official: 'Limited - API is provided as-is',
      community: 'GitHub discussions and issues',
    },
    defaultParameters: {
      format: 'json',
      audioQuality: 'hi',
      pagination: true,
      size: 10,
      liveAudioTemplateId: 2,
      onDemandAudioTemplateId: 1,
    },
  }),

  'sr://channels/all': () => ({
    rikskanaler: [
      {
        id: 132,
        name: 'P1',
        description: 'den talade kanalen',
        color: '31a1bd',
        type: 'Rikskanal',
        focus: 'Nyheter, samhälle, kultur',
      },
      {
        id: 163,
        name: 'P2',
        description: 'klassisk musik och kultur',
        color: 'e02e3d',
        type: 'Rikskanal',
        focus: 'Klassisk musik, jazz, folkmusik',
      },
      {
        id: 164,
        name: 'P3',
        description: 'ung svensk radio',
        color: 'ffed00',
        type: 'Rikskanal',
        focus: 'Populärmusik, ungdomskultur',
      },
      {
        id: 701,
        name: 'P4',
        description: 'sveriges lokalradio',
        color: '6db928',
        type: 'Rikskanal',
        focus: 'Lokala nyheter och musik',
      },
    ],
    lokalkanaler: [
      { id: 213, name: 'P4 Blekinge', region: 'Blekinge' },
      { id: 214, name: 'P4 Dalarna', region: 'Dalarna' },
      { id: 215, name: 'P4 Gotland', region: 'Gotland' },
      { id: 216, name: 'P4 Gävleborg', region: 'Gävleborg' },
      { id: 217, name: 'P4 Göteborg', region: 'Göteborg' },
      { id: 218, name: 'P4 Halland', region: 'Halland' },
      { id: 219, name: 'P4 Jämtland', region: 'Jämtland' },
      { id: 220, name: 'P4 Jönköping', region: 'Jönköping' },
      { id: 221, name: 'P4 Kalmar', region: 'Kalmar' },
      { id: 222, name: 'P4 Kristianstad', region: 'Kristianstad' },
      { id: 223, name: 'P4 Kronoberg', region: 'Kronoberg' },
      { id: 224, name: 'P4 Malmöhus', region: 'Malmö' },
      { id: 225, name: 'P4 Norrbotten', region: 'Norrbotten' },
      { id: 226, name: 'P4 Sjuhärad', region: 'Sjuhärad' },
      { id: 227, name: 'P4 Skaraborg', region: 'Skaraborg' },
      { id: 228, name: 'P4 Stockholm', region: 'Stockholm' },
      { id: 229, name: 'P4 Sörmland', region: 'Sörmland' },
      { id: 230, name: 'P4 Uppland', region: 'Uppsala' },
      { id: 231, name: 'P4 Värmland', region: 'Värmland' },
      { id: 232, name: 'P4 Västerbotten', region: 'Västerbotten' },
      { id: 233, name: 'P4 Västernorrland', region: 'Västernorrland' },
      { id: 234, name: 'P4 Västmanland', region: 'Västmanland' },
      { id: 235, name: 'P4 Väst', region: 'Västra Götaland' },
      { id: 236, name: 'P4 Örebro', region: 'Örebro' },
      { id: 237, name: 'P4 Östergötland', region: 'Östergötland' },
    ],
    specialkanaler: [
      { id: 2562, name: 'P4 Plus', description: 'Extra P4-innehåll' },
      { id: 4540, name: 'Radioapans knattekanal', description: 'Barnradio' },
      { id: 4951, name: 'SR Klassiskt', description: 'Klassisk musik dygnet runt' },
    ],
    usage: {
      note: 'Use channel IDs in API calls',
      example: 'list_channels with channelId=132 gets P1',
    },
  }),

  'sr://audio/quality-guide': () => ({
    qualities: {
      hi: {
        bitrate: '192-320 kbps',
        description: 'Högsta kvalitet',
        usage: 'Rekommenderat för bästa ljudupplevelse',
        fileSize: 'Större filer (~20-40 MB per timme)',
        recommended: true,
      },
      normal: {
        bitrate: '96-128 kbps',
        description: 'Standard kvalitet',
        usage: 'Bra balans mellan kvalitet och storlek',
        fileSize: 'Medel (~10-15 MB per timme)',
        recommended: false,
      },
      low: {
        bitrate: '32-64 kbps',
        description: 'Låg kvalitet',
        usage: 'För begränsad bandbredd eller mobil data',
        fileSize: 'Små filer (~5 MB per timme)',
        recommended: false,
      },
    },
    streamFormats: {
      live: {
        templateId_1: {
          format: 'AAC',
          description: 'Modern, effektiv komprimering',
          compatibility: 'De flesta moderna enheter',
        },
        templateId_2: {
          format: 'MP3',
          description: 'Klassiskt format',
          compatibility: 'Universell kompatibilitet',
          default: true,
        },
      },
      onDemand: {
        listenPodFile: {
          description: 'För streaming/uppspelning',
          includes: 'Musik inkluderad',
          format: 'MP3/M4A',
        },
        downloadPodFile: {
          description: 'För nedladdning',
          includes: 'Musik borttagen (licensskäl)',
          format: 'MP3',
        },
        broadcast: {
          description: 'Komplett sändning',
          includes: 'All musik inkluderad',
          format: 'M4A',
        },
      },
    },
    recommendations: {
      streaming: 'Använd "hi" kvalitet för bästa upplevelse',
      downloading: 'Använd "normal" för att spara utrymme',
      mobile: 'Använd "low" vid dålig uppkoppling',
      podcast: 'listenPodFile för streaming, downloadPodFile för offline',
    },
    apiParameters: {
      audioQuality: 'low | normal | hi (default: hi)',
      liveAudioTemplateId: '1 (AAC) | 2 (MP3, default)',
      onDemandAudioTemplateId: '1 (default)',
    },
  }),

  'sr://categories/programs': () => ({
    categories: [
      { id: 1, name: 'Kultur', description: 'Konst, litteratur, film, teater' },
      { id: 2, name: 'Musik', description: 'Alla musikgenrer och musikprogram' },
      { id: 3, name: 'Livsstil', description: 'Hälsa, mat, trädgård, boende' },
      { id: 4, name: 'Underhållning', description: 'Humor, quiz, underhållning' },
      { id: 5, name: 'Dokumentär', description: 'Dokumentärer och reportage' },
      { id: 6, name: 'Vetenskap', description: 'Forskning, teknik, natur' },
      { id: 7, name: 'Samhälle', description: 'Politik, ekonomi, samhällsfrågor' },
      { id: 8, name: 'Barn', description: 'Program för barn och ungdomar' },
      { id: 9, name: 'Sport', description: 'Sportreportage och sportprogram' },
      { id: 10, name: 'Nyheter', description: 'Nyheter och aktualiteter' },
      { id: 11, name: 'Natur', description: 'Natur, djur, miljö' },
      { id: 12, name: 'Historia', description: 'Historiska program och berättelser' },
      { id: 13, name: 'Drama', description: 'Radioteater och ljuddrama' },
      { id: 14, name: 'Religion', description: 'Religion och livsfrågor' },
      { id: 15, name: 'Blandat', description: 'Blandade ämnen' },
    ],
    usage: {
      apiTool: 'list_program_categories',
      filter: 'Use programCategoryId in search_programs',
      example: 'search_programs with programCategoryId=10 gets news programs',
    },
    popularCategories: [
      { id: 10, name: 'Nyheter', programs: 'Ekot, Ekonomiekot, Kulturnytt' },
      { id: 5, name: 'Dokumentär', programs: 'P3 Dokumentär, P1 Dokumentär' },
      { id: 2, name: 'Musik', programs: 'P2 Musik, Musikguiden' },
      { id: 7, name: 'Samhälle', programs: 'Studio Ett, Konflikt' },
    ],
  }),
};
