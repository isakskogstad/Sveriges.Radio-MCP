/**
 * MCP Prompts - Sveriges Radio Use Case Templates
 * 6 prompts for common user scenarios
 */

export const allPrompts = [
  {
    name: 'find-podcast',
    description: 'Hitta och lyssna på podcasts från Sveriges Radio baserat på ämne eller intresse',
    arguments: [
      {
        name: 'topic',
        description: 'Vad är du intresserad av? (t.ex. "historia", "true crime", "politik", "musik")',
        required: true,
      },
      {
        name: 'limit',
        description: 'Max antal förslag (default: 5)',
        required: false,
      },
    ],
  },
  {
    name: 'whats-on-now',
    description: 'Se vad som sänds just nu på Sveriges Radio - på en kanal eller alla kanaler',
    arguments: [
      {
        name: 'channel',
        description: 'Specifik kanal (P1, P2, P3, P4) eller lämna tomt för alla kanaler',
        required: false,
      },
    ],
  },
  {
    name: 'traffic-nearby',
    description: 'Kolla trafikläget i ditt område - olyckor, köer, vägarbeten och störningar',
    arguments: [
      {
        name: 'location',
        description: 'Plats eller område (t.ex. "Stockholm", "Göteborg", "E4")',
        required: true,
      },
      {
        name: 'severity',
        description: 'Min allvarlighetsgrad 1-5 (1=mycket allvarlig, 5=mindre störning). Default: alla nivåer',
        required: false,
      },
    ],
  },
  {
    name: 'news-briefing',
    description: 'Få en sammanfattning av senaste nyheterna från Sveriges Radio',
    arguments: [
      {
        name: 'program',
        description: 'Specifikt nyhetsprogram (t.ex. "Ekot", "Ekonomiekot", "Kulturnytt") eller lämna tomt för alla nyheter',
        required: false,
      },
    ],
  },
  {
    name: 'explore-schedule',
    description: 'Utforska Sveriges Radios tablå för en kanal och datum',
    arguments: [
      {
        name: 'channel',
        description: 'Kanal (P1, P2, P3, P4, eller region som "P4 Stockholm")',
        required: true,
      },
      {
        name: 'date',
        description: 'Datum (YYYY-MM-DD) - lämna tomt för idag',
        required: false,
      },
    ],
  },
  {
    name: 'whats-playing-now',
    description: '🎵 Visa vilken låt som spelas just nu på en musikkanal (perfekt för P2!)',
    arguments: [
      {
        name: 'channel',
        description: 'Musikkanal (t.ex. "P2", "P3", "SR Klassiskt")',
        required: true,
      },
    ],
  },
];

// Prompt message generators
export const promptMessages: Record<string, (args: Record<string, string>) => string> = {
  'find-podcast': (args) => {
    const { topic, limit = '5' } = args;
    return `Jag letar efter podcasts om "${topic}" från Sveriges Radio.

Använd följande verktyg i ordning:

1. **search_programs** med:
   - query: "${topic}"
   - hasOnDemand: true (endast program med podcast)
   - size: ${limit}

2. För varje intressant program, använd **get_latest_episode** för att få senaste avsnittet

3. Presentera resultaten så här:
   📻 **Programnamn** (Kanal)
   Beskrivning av programmet

   🎧 Senaste avsnitt: "Titel"
   Publicerat: [datum]
   Varaktighet: [minuter] min

   🔗 Lyssna: [listenPodFile.url]
   💾 Ladda ner: [downloadPodFile.url]

Sortera efter relevans och ge max ${limit} förslag.`;
  },

  'whats-on-now': (args) => {
    const { channel } = args;

    if (channel) {
      // Specific channel
      const channelUpper = channel.toUpperCase();
      return `Visa vad som sänds JUST NU på ${channelUpper}.

Använd följande verktyg:

1. **list_channels** för att hitta kanal-ID för ${channelUpper}
2. **get_channel_rightnow** med channelId från steg 1

Presentera så här:
🔴 **PÅGÅR NU** på ${channelUpper}
Kl [starttid]-[sluttid]: **Programnamn**
${channel === 'P2' || channel === 'p2' || channel === 'P3' || channel === 'p3' ? '\n🎵 Bonus: Använd **get_playlist_rightnow** för att se vilken låt som spelas!' : ''}

📻 Live stream: [liveAudio.url]

⏮️ Föregående: [programnamn]
⏭️ Nästa: [programnamn] kl [tid]`;
    }

    // All channels
    return `Visa en översikt av vad som sänds JUST NU på alla Sveriges Radio-kanaler.

Använd verktyget: **get_all_rightnow** med sortBy: "channel.name"

Presentera så här:

🔴 VAD SOM SÄNDS NU (${new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })})

**P1** - [programnamn] (kl [starttid]-[sluttid])
**P2** - [programnamn] (kl [starttid]-[sluttid])
**P3** - [programnamn] (kl [starttid]-[sluttid])
**P4** - [programnamn] (kl [starttid]-[sluttid])

... och alla lokala P4-kanaler ...

💡 Tips: Välj en kanal och använd "whats-on-now" med kanalnamn för mer detaljer!`;
  },

  'traffic-nearby': (args) => {
    const { location, severity } = args;
    const severityFilter = severity ? parseInt(severity) : null;

    return `Kolla trafikläget för ${location}.

Använd följande verktyg:

1. **get_traffic_areas** för att hitta rätt trafikområde för "${location}"
2. **get_traffic_messages** med trafficAreaName från steg 1

${severityFilter ? `Filtrera endast meddelanden med priority <= ${severityFilter}` : ''}

Presentera per kategori:

🚗 **VÄGTRAFIK**
${severityFilter === 1 ? '🚨 [Mycket allvarliga händelser]' : ''}
[Priority] [Plats]: [Beskrivning]

🚆 **KOLLEKTIVTRAFIK**
[Priority] [Plats]: [Beskrivning]

🚧 **PLANERADE STÖRNINGAR**
[Priority] [Plats]: [Beskrivning]

ℹ️ **ÖVRIGT**
[Priority] [Plats]: [Beskrivning]

Legend: Priority 1=🚨 Mycket allvarlig, 2=⚠️ Stor händelse, 3=⚡ Störning, 4=ℹ️ Info, 5=💨 Mindre`;
  },

  'news-briefing': (args) => {
    const { program } = args;

    if (program) {
      // Specific news program
      return `Ge mig senaste nyheterna från ${program}.

Använd följande verktyg:

1. **search_programs** med query="${program}" för att hitta program-ID
2. **get_latest_episode** med programId från steg 1

Presentera så här:

📰 **${program.toUpperCase()}**
Publicerat: [publishDateUtc, formatera till svensk tid]
Varaktighet: [duration] sekunder

📝 ${program === 'Ekot' ? 'Huvudnyheter' : 'Innehåll'}:
[description]

🎧 Lyssna: [listenPodFile.url]
🔗 Länk: [url]`;
    }

    // All news
    return `Ge mig en sammanfattning av senaste nyheterna från Sveriges Radio.

Använd verktyget: **get_latest_news_episodes**

Gruppera och presentera:

📰 **SENASTE NYHETERNA** (${new Date().toLocaleDateString('sv-SE')})

**RIKSNYHETER:**
• Ekot - [titel] ([tid])
• Ekonomiekot - [titel] ([tid])
• Kulturnytt - [titel] ([tid])

**LOKALA NYHETER:**
• P4 [Region] - [titel] ([tid])
(visa 3-5 olika regioner)

💡 För mer detaljer, använd "news-briefing" med specifikt program!`;
  },

  'explore-schedule': (args) => {
    const { channel, date } = args;
    const dateStr = date || new Date().toISOString().split('T')[0];
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    return `Visa tablån för ${channel}${date ? ` den ${date}` : ' idag'}.

Använd följande verktyg:

1. **list_channels** för att hitta kanal-ID för ${channel}
2. **get_channel_schedule** med:
   - channelId från steg 1
   - date: "${dateStr}"

Presentera kronologiskt:

📅 **TABLÅ FÖR ${channel.toUpperCase()}** - ${isToday ? 'IDAG' : dateStr}

${isToday ? '🔴 = Sänds NU\n' : ''}
06:00 - 09:00: **Morgonprogram**
   [Beskrivning]${isToday ? ' 🔴' : ''}

09:00 - 12:00: **Förmiddagsprogram**
   [Beskrivning]

12:00 - 15:00: **Eftermiddagsprogram**
   [Beskrivning]

... och så vidare ...

⭐ = Program med tillgänglig podcast
🎵 = Musikprogram

💡 Tips: Använd get_episode för program-ID att få ljudfiler!`;
  },

  'whats-playing-now': (args) => {
    const { channel } = args;
    const channelUpper = channel.toUpperCase();

    return `Visa vilken låt som spelas JUST NU på ${channelUpper}!

Använd följande verktyg:

1. **list_channels** för att hitta kanal-ID för ${channelUpper}
2. **get_playlist_rightnow** med channelId från steg 1

Presentera så här:

🎵 **NU SPELAS PÅ ${channelUpper}**

🎼 **${channelUpper === 'P2' ? 'NU:' : 'Current Song:'}**
"[Titel]"
${channelUpper === 'P2' ? '🎻 Kompositör: [composer]' : '🎤 Artist: [artist]'}
💿 Album: [albumName]
🏷️ Skivbolag: [recordLabel]

⏰ Spelas: [startTimeUtc] - [stopTimeUtc]

${channelUpper === 'P2' ? '🎼 Tips: P2 spelar klassisk musik! För popmusik, prova P3!' : ''}

⏭️ **NÄSTA LÅT:**
"[nextSong.title]" - [nextSong.artist]

💡 Använd **get_channel_rightnow** för att se vilket program som sänds!`;
  },
};
