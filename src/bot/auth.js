'use strict';

// Organizer whitelist from env — parsed once at startup
const ORGANIZER_IDS = new Set(
  (process.env.ORGANIZER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
);

function isOrganizer(userId) {
  // If whitelist is empty, allow everyone (facilitates first-time setup)
  if (ORGANIZER_IDS.size === 0) return true;
  return ORGANIZER_IDS.has(userId);
}

module.exports = { isOrganizer };
