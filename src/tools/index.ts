/**
 * Tool Registry - All SR MCP Tools
 */

import { channelTools } from './channels.js';
import { programTools } from './programs.js';
import { episodeTools } from './episodes.js';
import { scheduleTools } from './schedule.js';
import { playlistTools } from './playlists.js';
import { newsTools } from './news.js';
import { trafficTools } from './traffic.js';
import { miscTools } from './misc.js';

// Export all tools
export const allTools = [
  ...channelTools,
  ...programTools,
  ...episodeTools,
  ...scheduleTools,
  ...playlistTools,
  ...newsTools,
  ...trafficTools,
  ...miscTools,
];

// Export individual handlers
export * from './channels.js';
export * from './programs.js';
export * from './episodes.js';
export * from './schedule.js';
export * from './playlists.js';
export * from './news.js';
export * from './traffic.js';
export * from './misc.js';
