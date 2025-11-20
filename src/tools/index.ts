/**
 * Tool Registry - All SR MCP Tools
 */

import { channelTools } from './channels.js';

// Export all tools
export const allTools = [
  ...channelTools,
  // More tools will be added here
];

// Export tool handlers
export { listChannels, getChannelRightNow } from './channels.js';
