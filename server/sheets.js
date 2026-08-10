import { google } from 'googleapis';
import { parse, isValid } from 'date-fns';

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------
let cache = null;
let cacheTime = 0;

function getCacheTtl() {
  return (parseInt(process.env.CACHE_TTL_SECONDS, 10) || 60) * 1000;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set');
  const key = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

// ---------------------------------------------------------------------------
// Source mapping — PPC is explicit, everything else is SEO
// ---------------------------------------------------------------------------
function mapWebsiteSource(raw) {
  return raw === 'google_paid' ? 'PPC' : 'SEO';
}

function mapCallsSource(raw) {
  return raw === 'Google Ads' ? 'PPC' : 'SEO';
}

// ---------------------------------------------------------------------------
// Row normalization
// ---------------------------------------------------------------------------
function normalizeWebsiteLead(row, headers) {
  const get = (col) => {
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] ?? '') : '';
  };

  const rawPatient = get('Are you an existing patient?');
  const isExistingPatient =
    rawPatient === 'Yes' ? 'Yes' : rawPatient === 'No' ? 'No' : null;

  const rawCountry = get('Lead Country');
  const country = rawCountry && rawCountry !== '-' ? rawCountry : null;

  // "April 15, 2026 at 3:15 PM"
  const rawDate = get('Lead Date');
  const parsed = parse(rawDate, "MMMM d, yyyy 'at' h:mm a", new Date());
  if (!isValid(parsed)) {
    console.warn('Dropping website lead — bad date:', rawDate);
    return null;
  }

  return {
    email: get('Email'),
    isExistingPatient,
    country,
    source: mapWebsiteSource(get('Lead Source')),
    leadDate: parsed.toISOString(),
  };
}

function normalizeCallLead(row, headers) {
  const get = (col) => {
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] ?? '') : '';
  };

  // "2026-05-01 11:49:17"
  const rawDateTime = get('Date & Time');
  const parsed = new Date(rawDateTime.replace(' ', 'T'));
  if (!isValid(parsed)) {
    console.warn('Dropping call lead — bad date:', rawDateTime);
    return null;
  }

  return {
    callStatus: get('Call Status'),
    source: mapCallsSource(get('Source')),
    durationSeconds: parseInt(get('Duration (seconds)'), 10) || 0,
    dateTime: parsed.toISOString(),
    callerNumber: get('Caller Number'),
    remarks: get('Call Remarks') || null,
    tag: get('Tags') || null,
    recordingUrl: get('Recording Link'),
  };
}

// ---------------------------------------------------------------------------
// Fetch a single sheet tab
// ---------------------------------------------------------------------------
async function fetchSheet(auth, spreadsheetId, tab) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: tab,
  });
  return res.data.values || [];
}

// ---------------------------------------------------------------------------
// Public: fetch + normalize + cache
// ---------------------------------------------------------------------------
export async function fetchLeadsFromSheets({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cacheTime < getCacheTtl()) {
    return cache;
  }

  const auth = getAuth();
  const errors = [];
  let website = [];
  let calls = [];

  const websiteTabs = (process.env.GOOGLE_WEBSITE_TAB || 'Book Appointment')
    .split(',')
    .map((t) => t.trim());

  const callsTabs = (process.env.GOOGLE_CALLS_TAB || 'Calls - May 2026')
    .split(',')
    .map((t) => t.trim());

  const allFetches = [
    ...websiteTabs.map((tab) =>
      fetchSheet(auth, process.env.GOOGLE_WEBSITE_SHEET_ID, tab),
    ),
    ...callsTabs.map((tab) =>
      fetchSheet(auth, process.env.GOOGLE_CALLS_SHEET_ID, tab),
    ),
  ];

  const results = await Promise.allSettled(allFetches);
  const websiteResults = results.slice(0, websiteTabs.length);
  const callsResults = results.slice(websiteTabs.length);

  for (let i = 0; i < websiteResults.length; i++) {
    const result = websiteResults[i];
    if (result.status === 'fulfilled' && result.value.length > 0) {
      const [headers, ...rows] = result.value;
      website.push(...rows.map((r) => normalizeWebsiteLead(r, headers)).filter(Boolean));
    } else if (result.status === 'rejected') {
      console.error(`Website sheet error (${websiteTabs[i]}):`, result.reason.message);
      errors.push({ sheet: `website:${websiteTabs[i]}`, message: result.reason.message });
    }
  }

  for (let i = 0; i < callsResults.length; i++) {
    const result = callsResults[i];
    if (result.status === 'fulfilled' && result.value.length > 0) {
      const [headers, ...rows] = result.value;
      calls.push(...rows.map((r) => normalizeCallLead(r, headers)).filter(Boolean));
    } else if (result.status === 'rejected') {
      console.error(`Calls sheet error (${callsTabs[i]}):`, result.reason.message);
      errors.push({ sheet: `calls:${callsTabs[i]}`, message: result.reason.message });
    }
  }

  const result = {
    fetchedAt: new Date().toISOString(),
    website,
    calls,
    ...(errors.length > 0 && { errors }),
  };

  cache = result;
  cacheTime = Date.now();

  return result;
}
