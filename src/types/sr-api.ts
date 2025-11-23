/**
 * Sveriges Radio API TypeScript Definitions
 * Generated from official API documentation and sverigesradio-api-js
 */

/**
 * Standardized pagination model (following TESTING_REPORT.md recommendations)
 * Provides consistent pagination across all endpoints
 */
export interface StandardPagination {
  page: number;
  pageSize: number;
  totalHits: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageUrl?: string;
  previousPageUrl?: string;
}

/**
 * Original SR API pagination format (for internal use)
 */
export interface SRPagination {
  page: number;
  size: number;
  totalhits: number;
  totalpages: number;
  nextpage?: string;
  previouspage?: string;
}

/**
 * Helper function to convert SR pagination to standard format
 */
export function normalizePagination(srPagination: SRPagination): StandardPagination {
  return {
    page: srPagination.page,
    pageSize: srPagination.size,
    totalHits: srPagination.totalhits,
    totalPages: srPagination.totalpages,
    hasNextPage: !!srPagination.nextpage,
    hasPreviousPage: !!srPagination.previouspage,
    nextPageUrl: srPagination.nextpage,
    previousPageUrl: srPagination.previouspage,
  };
}

export interface PaginatedResponse<T> {
  copyright: string;
  pagination: SRPagination;
  [key: string]: T[] | any; // Dynamic key for channels, programs, episodes, etc.
}

export interface SRChannel {
  id: number;
  name: string;
  image: string;
  color: string;
  tagline: string;
  siteurl: string;
  liveaudio: {
    id: number;
    url: string;
    statkey: string;
  };
  scheduleurl: string;
  channeltype: 'Rikskanal' | 'Lokal kanal' | string;
  xmltvid: string;
}

export interface SRProgram {
  id: number;
  name: string;
  description: string;
  programcategory: {
    id: number;
    name: string;
  };
  podgroups?: Array<{
    id: number;
    name: string;
  }>;
  payoff?: string;
  broadcastinfo?: string;
  email?: string;
  phone?: string;
  programurl: string;
  programimage: string;
  socialimage: string;
  channel: {
    id: number;
    name?: string;
  };
  archived: boolean;
  hasondemand: boolean;
}

export interface SRProgramCategory {
  id: number;
  name: string;
}

export interface PodFile {
  id: number;
  url: string;
  statkey: string;
  duration: number;
  publishdateutc: string;
  title: string;
  description: string;
  filesizeinbytes: number;
  program: {
    id: number;
    name: string;
  };
}

export interface SREpisode {
  id: number;
  title: string;
  description: string;
  text?: string;
  url: string;
  program: {
    id: number;
    name: string;
  };
  publishdateutc: string;
  imageurl: string;
  imageurltemplate?: string;
  broadcast?: {
    availablestoputc: string;
    playlist?: {
      id: number;
      url: string;
      statkey: string;
      duration: number;
      publishdateutc: string;
    };
    broadcastfiles?: Array<{
      id: number;
      url: string;
      statkey: string;
      duration: number;
      publishdateutc: string;
    }>;
  };
  listenpodfile?: PodFile;
  downloadpodfile?: PodFile;
  relatedepisodes?: any[];
  episodegroups?: Array<{
    id: number;
    name: string;
  }>;
  availableuntilutc?: string;
}

export interface SRScheduleEpisode {
  episodeid?: number;
  title: string;
  subtitle?: string;
  starttimeutc: string;
  endtimeutc: string;
  url?: string;
  program: {
    id: number;
    name: string;
  };
  channel: {
    id: number;
    name: string;
  };
  imageurl?: string;
  imageurltemplate?: string;
  socialimage?: string;
}

export interface SRScheduleChannel {
  id: number;
  name: string;
  previousscheduledepisode?: SRScheduleEpisode;
  currentscheduledepisode?: SRScheduleEpisode;
  nextscheduledepisode?: SRScheduleEpisode;
}

export interface SRTrafficMessage {
  id: number;
  priority: 1 | 2 | 3 | 4 | 5; // 1=Most severe, 5=Minor
  createddate: string;
  title: string;
  exactlocation?: string;
  description: string;
  latitude: number;
  longitude: number;
  category: 0 | 1 | 2 | 3; // 0=Road, 1=Public transit, 2=Planned, 3=Other
  subcategory: string;
}

export interface SRTrafficArea {
  name: string;
  zoom: number;
  radius: number;
  trafficdepartmentunitid: number;
}

export interface SRPlaylistSong {
  title: string;
  description?: string; // Sammansättning av artist/tonsättare och låtens titel
  artist?: string;
  composer?: string;
  conductor?: string;
  albumname?: string;
  recordlabel?: string;
  lyricist?: string;
  producer?: string;
  starttimeutc?: string;
  stoptimeutc?: string;
}

export interface SRPlaylistEntry {
  title: string;
  description?: string;
  artist?: string;
  composer?: string;
  conductor?: string;
  albumname?: string;
  recordlabel?: string;
  lyricist?: string;
  producer?: string;
  starttimeutc: string;
  stoptimeutc: string;
}

export interface SRPlaylist {
  copyright: string;
  song?: SRPlaylistSong;
  nextsong?: SRPlaylistSong;
  previoussong?: SRPlaylistSong;
  channel?: {
    id: number;
    name: string;
  };
  playlist?: SRPlaylistEntry[];
}

export interface SRSongList {
  copyright: string;
  song?: SRPlaylistEntry[];
}

export interface SRTopStory {
  id: number;
  title: string;
  abovetitle?: string;
  linktext?: string;
  backgroundcolor?: string;
  show?: {
    id: number;
    title: string;
    dateutc: string;
    starttimeutc: string;
    endtimeutc: string;
    type: 'livestream' | 'pod' | string;
    liveaudio?: {
      id: number;
      url: string;
      statkey: string;
    };
  };
  imageurl?: string;
  imageurltemplate?: string;
  publishendutc?: string;
}

export interface SRExtraBroadcast {
  id: number;
  name: string;
  description?: string;
  localstarttime: string;
  localstoptime: string;
  publisher: {
    id: number;
    name: string;
  };
  channel: {
    id: number;
    name: string;
  };
  liveaudio?: {
    id: number;
    url: string;
    statkey: string;
  };
  mobileliveaudio?: {
    id: number;
    url: string;
    statkey: string;
  };
  issport?: boolean;
}

export interface SREpisodeGroup {
  id: number;
  title: string;
  description: string;
  episodes: SREpisode[];
}
