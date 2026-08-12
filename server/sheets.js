import { google } from 'googleapis';
import { parse, isValid } from 'date-fns';

// All sheet timestamps are Perth local time (AWST = UTC+8, no DST).
// Build a true absolute-instant Date from Perth-local components.
const PERTH_OFFSET_MS = 8 * 60 * 60 * 1000;
function perthLocalToDate(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, second) - PERTH_OFFSET_MS);
}

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

// GA4-style Book Appointment: PPC if the medium/source signals paid traffic;
// SEO otherwise. Defaults to SEO for unknown values so paid attribution
// isn't inflated.
function mapBookAppointmentSource(sessionSource, sessionMedium) {
  const source = (sessionSource || '').toLowerCase();
  const medium = (sessionMedium || '').toLowerCase();

  if (medium === 'cpc') return 'PPC';
  if (medium.startsWith('paid')) return 'PPC';
  if (source.includes('ads')) return 'PPC';
  if (source.includes('paid')) return 'PPC';
  return 'SEO';
}

function mapCallsSource(raw) {
  return raw === 'Google Ads' ? 'PPC' : 'SEO';
}

// ---------------------------------------------------------------------------
// Row normalization
// ---------------------------------------------------------------------------
// Book Appointment tab: GA4-only, 3 columns, no PII.
// Booked At format: "2026-08-10 09:15:30" (Perth local time, no TZ suffix).
function normalizeBookAppointmentLead(row, headers) {
  const get = (col) => {
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] ?? '') : '';
  };

  // Manual test-conversion filter: rows marked "Yes" in Is Test are dropped.
  // Blank / "No" / anything else = real conversion.
  if (get('Is Test').trim().toLowerCase() === 'yes') return null;

  // "2026-08-10 09:15:30" — Perth local time, no TZ suffix.
  const rawDate = get('Booked At');
  const parsed = new Date(rawDate.replace(' ', 'T') + '+08:00');
  if (!isValid(parsed)) {
    console.warn('Dropping Book Appointment row — bad date:', rawDate);
    return null;
  }

  const sessionSource = get('Session Source');
  const sessionMedium = get('Session Medium');

  return {
    type: 'appointment',
    email: null,
    isExistingPatient: null,
    country: null,
    source: mapBookAppointmentSource(sessionSource, sessionMedium),
    sessionSource: sessionSource || null,
    sessionMedium: sessionMedium || null,
    leadDate: parsed.toISOString(),
  };
}

// Contact tab: legacy form-fill schema. Columns include First/Last Name,
// Email, Phone, Message, Lead Country, Lead Source, Lead Date.
// Lead Date format: "April 15, 2026 at 3:15 PM".
function normalizeContactLead(row, headers) {
  const get = (col) => {
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] ?? '') : '';
  };

  const rawCountry = get('Lead Country');
  const country = rawCountry && rawCountry !== '-' ? rawCountry : null;

  // "April 15, 2026 at 3:15 PM" — parsed in server-local TZ, then reinterpreted as Perth.
  const rawDate = get('Lead Date');
  const local = parse(rawDate, "MMMM d, yyyy 'at' h:mm a", new Date());
  if (!isValid(local)) {
    console.warn('Dropping Contact row — bad date:', rawDate);
    return null;
  }
  const parsed = perthLocalToDate(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    local.getHours(),
    local.getMinutes(),
  );

  return {
    type: 'contact',
    email: get('Email'),
    isExistingPatient: null,
    country,
    source: mapWebsiteSource(get('Lead Source')),
    leadDate: parsed.toISOString(),
  };
}

// Dispatch to the right normalizer based on which schema this tab uses.
function normalizeWebsiteLead(row, headers) {
  if (headers.includes('Booked At')) return normalizeBookAppointmentLead(row, headers);
  return normalizeContactLead(row, headers);
}

function normalizeCallLead(row, headers) {
  const get = (col) => {
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] ?? '') : '';
  };

  // "2026-05-01 11:49:17" — Perth local time, no TZ suffix.
  const rawDateTime = get('Date & Time');
  const parsed = new Date(rawDateTime.replace(' ', 'T') + '+08:00');
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

// List every tab name in a spreadsheet — used when the env var is set to "all".
async function listSheetTabs(auth, spreadsheetId) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });
  return (res.data.sheets || []).map((s) => s.properties.title);
}

// Resolve an env-var tab list. "all" (case-insensitive) → every tab in the
// spreadsheet. Otherwise: comma-separated tab names, trimmed.
async function resolveTabs(auth, spreadsheetId, envValue, fallback) {
  const raw = (envValue || fallback).trim();
  if (raw.toLowerCase() === 'all') {
    return listSheetTabs(auth, spreadsheetId);
  }
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
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

  const callsTabs = await resolveTabs(
    auth,
    process.env.GOOGLE_CALLS_SHEET_ID,
    process.env.GOOGLE_CALLS_TAB,
    'Calls - May 2026',
  );

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
