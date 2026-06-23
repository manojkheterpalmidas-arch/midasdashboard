import { createId, nowIso } from "../utils/ids.js";

export const SHEET_COLUMNS = {
  Teams: ["id", "teamName", "teamLead", "region", "currency", "krwRate", "repsJson", "createdAt", "updatedAt"],
  Deals: [
    "id",
    "teamId",
    "repName",
    "year",
    "month",
    "companyName",
    "product",
    "category",
    "dealType",
    "minAmount",
    "maxAmount",
    "probability",
    "temperature",
    "status",
    "closedAmount",
    "expectedCloseDate",
    "comments",
    "nextAction",
    "createdAt",
    "updatedAt",
    "repComment",
    "managerComment",
    "hubspotDealUrl"
  ],
  MonthlyGoals: ["id", "teamId", "repName", "year", "month", "category", "goalType", "targetAmount", "createdAt", "updatedAt"],
  UserRoles: ["id", "email", "role", "teamId", "repName", "createdAt", "updatedAt", "googleSub"],
  Settings: ["key", "value"],
  AuditLog: ["id", "timestamp", "userEmail", "action", "entityType", "entityId", "detailsJson"]
};

const SHEETS_SCOPE = "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email";
const API_ROOT = "https://sheets.googleapis.com/v4/spreadsheets";
const AUDIT_ENABLED = import.meta.env.VITE_ENABLE_AUDIT_LOG === "true";

function normalizeRoleValue(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "team lead") return "Team Lead";
  if (normalized === "manager") return "Manager";
  if (normalized === "team member") return "Team Member";
  return "Team Member";
}

// Persist auth in localStorage so it survives closing the app (sessionStorage
// is wiped on close, which forced a fresh Google login every launch).
const TOKEN_KEY = "midas-google-access-token";
const TOKEN_EXP_KEY = "midas-google-token-expiry";
const EMAIL_KEY = "midas-google-email";
const SUB_KEY = "midas-google-sub";

function loadStored(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
}

let tokenClient = null;
let pendingToken = null;
let accessToken = loadStored(TOKEN_KEY);
let tokenExpiry = Number(localStorage.getItem(TOKEN_EXP_KEY)) || 0;
let signedInEmail = loadStored(EMAIL_KEY);
let signedInGoogleSub = loadStored(SUB_KEY);
let lastConnectionCheckAt = 0;

function emitConnectionState(status, message = "") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("midas-google-sheets-connection", {
      detail: { status, message, expiresAt: tokenExpiry, email: signedInEmail }
    })
  );
}

// Store the token and when it expires (refresh a minute early for safety).
function persistAccessToken(token, expiresInSeconds) {
  accessToken = token || "";
  if (token) {
    const ttlMs = (Number(expiresInSeconds) || 3600) * 1000;
    tokenExpiry = Date.now() + Math.max(ttlMs - 60000, 0);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXP_KEY, String(tokenExpiry));
    sessionStorage.setItem("midas-google-session", "true");
    emitConnectionState("connected", "Google access renewed.");
  } else {
    tokenExpiry = 0;
    lastConnectionCheckAt = 0;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
    emitConnectionState("reconnect", "Google Sheets access needs to be renewed.");
  }
}
let spreadsheetId = extractSpreadsheetId(import.meta.env.VITE_DEFAULT_SPREADSHEET_ID || localStorage.getItem("midas-google-spreadsheet-id") || "");
let allDataCache = null;
const sheetCache = {};
const sheetHeaders = {};
const CORE_READ_SHEETS = ["Teams", "Deals", "MonthlyGoals", "UserRoles", "Settings"];

function extractSpreadsheetId(value) {
  const text = String(value || "").trim();
  const match = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : text;
}

export function getSpreadsheetId() {
  return spreadsheetId;
}

export function setSpreadsheetId(nextId) {
  spreadsheetId = extractSpreadsheetId(nextId);
  localStorage.setItem("midas-google-spreadsheet-id", spreadsheetId);
}

export function getUserEmail() {
  return signedInEmail || loadStored(EMAIL_KEY);
}

export function getUserGoogleSub() {
  return signedInGoogleSub || loadStored(SUB_KEY);
}

function rememberGoogleIdentity(identity = {}) {
  if (identity.email) {
    signedInEmail = identity.email;
    localStorage.setItem(EMAIL_KEY, signedInEmail);
  }
  const sub = identity.sub || identity.user_id || identity.userId;
  if (sub) {
    signedInGoogleSub = String(sub);
    localStorage.setItem(SUB_KEY, signedInGoogleSub);
  }
  if (signedInEmail || signedInGoogleSub) sessionStorage.removeItem("midas-google-email-error");
}

function decodeJwtPayload(token) {
  if (!token || !String(token).includes(".")) return {};
  try {
    const payload = String(token).split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    return JSON.parse(decodeURIComponent(Array.from(decoded).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")));
  } catch {
    return {};
  }
}

async function refreshUserEmail() {
  if (!accessToken || (signedInEmail && signedInGoogleSub)) return signedInEmail;
  const profileEndpoints = [
    "https://www.googleapis.com/oauth2/v3/userinfo",
    "https://www.googleapis.com/oauth2/v2/userinfo",
    "https://openidconnect.googleapis.com/v1/userinfo"
  ];

  for (const endpoint of profileEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const profile = await response.json().catch(() => ({}));
      if (response.ok && (profile.email || profile.sub)) {
        rememberGoogleIdentity(profile);
        return signedInEmail;
      }
      if (profile.error_description || profile.error) sessionStorage.setItem("midas-google-email-error", profile.error_description || profile.error);
    } catch (error) {
      sessionStorage.setItem("midas-google-email-error", error.message || "Could not read Google profile.");
    }
  }

  const tokenInfoEndpoints = [
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  ];
  for (const endpoint of tokenInfoEndpoints) {
    try {
      const tokenInfo = await fetch(endpoint).then((res) => res.json());
      if (tokenInfo.email || tokenInfo.sub || tokenInfo.user_id) {
        rememberGoogleIdentity(tokenInfo);
        return signedInEmail;
      }
      if (tokenInfo.error_description || tokenInfo.error) sessionStorage.setItem("midas-google-email-error", tokenInfo.error_description || tokenInfo.error);
    } catch (error) {
      sessionStorage.setItem("midas-google-email-error", error.message || "Could not inspect Google token.");
    }
  }
  signedInEmail = "";
  return signedInEmail;
}

export async function ensureUserEmail() {
  signedInEmail = signedInEmail || loadStored(EMAIL_KEY);
  signedInGoogleSub = signedInGoogleSub || loadStored(SUB_KEY);
  if (signedInEmail && signedInGoogleSub) return signedInEmail;
  return refreshUserEmail();
}

export function getUserEmailError() {
  return sessionStorage.getItem("midas-google-email-error") || "";
}

function clientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
}

export function hasGoogleConfig() {
  return Boolean(clientId());
}

export function consumeRedirectToken() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const token = hash.get("access_token");
  const error = hash.get("error");
  if (error) throw new Error(hash.get("error_description") || error);
  if (!token) return false;
  persistAccessToken(token, hash.get("expires_in"));
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return true;
}

export function redirectSignIn() {
  if (!clientId()) throw new Error("Missing VITE_GOOGLE_CLIENT_ID.");
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: window.location.origin,
    response_type: "token",
    scope: SHEETS_SCOPE,
    include_granted_scopes: "true",
    prompt: "consent"
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function waitForGoogle() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    if (!document.querySelector('script[data-midas-google-identity="true"]')) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.midasGoogleIdentity = "true";
      script.onerror = () => reject(new Error("Google Identity Services could not load. Check browser privacy settings, ad blockers, network access, or allowed origins."));
      document.head.appendChild(script);
    }
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(timer);
        resolve();
      }
      if (Date.now() - started > 10000) {
        clearInterval(timer);
        reject(new Error(`Google Identity Services did not load. Disable blockers for accounts.google.com and confirm ${window.location.origin} is an authorized JavaScript origin for this OAuth client.`));
      }
    }, 100);
  });
}

// One shared token client. Its callback resolves whichever token request
// (interactive sign-in or background refresh) is currently in flight.
function buildTokenClient() {
  return window.google.accounts.oauth2.initTokenClient({
    client_id: clientId(),
    scope: SHEETS_SCOPE,
    prompt: "",
    callback: async (response) => {
      const resolver = pendingToken;
      pendingToken = null;
      if (response.error) {
        resolver?.reject(new Error(response.error));
        return;
      }
      persistAccessToken(response.access_token, response.expires_in);
      rememberGoogleIdentity(decodeJwtPayload(response.id_token));
      if (!signedInEmail || !signedInGoogleSub) {
        try {
          const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
          }).then((res) => res.json());
          rememberGoogleIdentity(profile);
        } catch {
          /* identity lookup is best-effort */
        }
      }
      resolver?.resolve({ ok: true, email: signedInEmail });
    },
    error_callback: (error) => {
      const resolver = pendingToken;
      pendingToken = null;
      resolver?.reject(new Error(error?.message || error?.type || "Google sign-in was blocked or cancelled."));
    }
  });
}

// In the desktop (.exe) build a preload bridge handles Google sign-in in the
// system browser (so passkeys / Windows Hello work). In a normal browser this
// is undefined and we use Google Identity Services as usual.
function desktopBridge() {
  return typeof window !== "undefined" && window.midasDesktop?.getToken ? window.midasDesktop : null;
}

async function requestToken(interactive) {
  const bridge = desktopBridge();
  if (bridge) {
    const result = await bridge.getToken(interactive);
    persistAccessToken(result.access_token, result.expires_in);
    if (result.email || result.sub) rememberGoogleIdentity({ email: result.email, sub: result.sub });
    return { ok: true, email: signedInEmail };
  }
  if (!clientId()) throw new Error("Missing VITE_GOOGLE_CLIENT_ID.");
  await waitForGoogle();
  if (!tokenClient) tokenClient = buildTokenClient();
  if (pendingToken) {
    pendingToken.reject(new Error("Superseded by a newer Google token request."));
    pendingToken = null;
  }
  return new Promise((resolve, reject) => {
    pendingToken = { resolve, reject };
    try {
      tokenClient.requestAccessToken({ prompt: interactive ? "select_account" : "" });
    } catch (error) {
      pendingToken = null;
      reject(error);
    }
  });
}

// Interactive: returning users with a live Google session are silent; brand-new
// users are shown the consent screen automatically. No forced re-consent.
export async function signIn() {
  return requestToken(true);
}

// Background refresh — never shows UI. Rejects if Google needs interaction.
async function silentRefresh() {
  return requestToken(false);
}

// Returns a valid token, silently refreshing first if the current one expired.
async function ensureValidToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  await silentRefresh();
  return accessToken;
}

export function isSignedIn() {
  return Boolean(accessToken);
}

export function getGoogleSheetsConnection() {
  const connected = Boolean(accessToken && Date.now() < tokenExpiry);
  return {
    status: connected ? "connected" : "reconnect",
    connected,
    expiresAt: tokenExpiry,
    email: signedInEmail
  };
}

export async function checkGoogleSheetsConnection({ force = false } = {}) {
  const fiveMinutes = 5 * 60 * 1000;
  if (
    !force &&
    accessToken &&
    Date.now() < tokenExpiry &&
    Date.now() - lastConnectionCheckAt < fiveMinutes
  ) {
    return getGoogleSheetsConnection();
  }
  await ensureValidToken();
  await sheetsFetch("?fields=spreadsheetId");
  return getGoogleSheetsConnection();
}

export function signOut() {
  if (typeof window !== "undefined" && window.midasDesktop?.signOut) {
    try {
      window.midasDesktop.signOut();
    } catch {
      /* best-effort: still clear local state below */
    }
  }
  persistAccessToken("");
  signedInEmail = "";
  signedInGoogleSub = "";
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(SUB_KEY);
  sessionStorage.removeItem("midas-google-session");
  sessionStorage.removeItem("midas-google-email-error");
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function requestLabel(path, method) {
  const decoded = decodeURIComponent(path);
  if (decoded.includes("batchGet")) return `batchGet ${decoded}`;
  if (decoded.includes(":append")) return `append ${decoded}`;
  if (decoded.includes(":clear")) return `clear ${decoded}`;
  if (decoded.includes("values:batchUpdate")) return `values.batchUpdate`;
  if (decoded.includes("/values/")) return `${method} ${decoded}`;
  return `${method} ${decoded}`;
}

async function sheetsFetch(path, options = {}) {
  if (!spreadsheetId) throw new Error("Set VITE_DEFAULT_SPREADSHEET_ID in the app environment first.");
  if (!accessToken) await signIn();
  else if (Date.now() >= tokenExpiry) {
    // Token expired: refresh silently before spending the request. If the
    // refresh needs interaction it will surface as a 401 and be handled below.
    await silentRefresh().catch(() => {});
  }
  const method = options.method || "GET";
  const label = requestLabel(path, method);
  let reauthed = false;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (import.meta.env.DEV) console.info(`[Sheets API] ${new Date().toISOString()} ${label}`);
    let response;
    try {
      response = await fetch(`${API_ROOT}/${spreadsheetId}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });
    } catch {
      const connectionError = new Error("Cannot reach Google Sheets. Check the internet connection, then use Check & refresh.");
      connectionError.status = 0;
      emitConnectionState("reconnect", connectionError.message);
      throw connectionError;
    }
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      lastConnectionCheckAt = Date.now();
      emitConnectionState("connected", "Google Sheets connection confirmed.");
      return payload;
    }
    if (response.status === 401 && !reauthed) {
      // Stale/revoked token — try one silent refresh and retry before failing.
      reauthed = true;
      try {
        await silentRefresh();
        continue;
      } catch {
        /* fall through and report the 401 so the app can prompt a login */
      }
    }
    if (response.status === 429 && attempt < 4) {
      const waitMs = 1000 * 2 ** attempt + Math.floor(Math.random() * 350);
      await sleep(waitMs);
      continue;
    }
    if (response.status === 401) persistAccessToken("");
    if (response.status === 403) {
      emitConnectionState("reconnect", payload.error?.message || "This Google account cannot access the forecast spreadsheet.");
    }
    const message =
      response.status === 401
        ? "Google Sheets connection expired. Use Reconnect Google Sheets and then retry your save."
        : response.status === 429
        ? "Google Sheets is temporarily rate-limiting requests. Please wait a few seconds."
        : payload.error?.message || `Google Sheets request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
}

function rowsToObjects(values = [], columns) {
  const [header = columns, ...rows] = values;
  return rows
    .map((row, rowIndex) => {
      const record = columns.reduce(
        (nextRecord, column) => {
        const index = header.indexOf(column);
        nextRecord[column] = index >= 0 ? row[index] ?? "" : "";
        return nextRecord;
        },
        { __rowNumber: rowIndex + 2 }
      );
      header.forEach((column, index) => {
        if (column && !Object.prototype.hasOwnProperty.call(record, column)) record[column] = row[index] ?? "";
      });
      return record;
    })
    .filter((row) => Object.keys(row).some((key) => key !== "__rowNumber" && String(row[key] || "").trim() !== ""));
}

async function ensureSheetHeaderColumns(sheetName, values = []) {
  const columns = SHEET_COLUMNS[sheetName];
  if (!columns) return [];
  const canonicalNames = new Map(columns.map((column) => [column.toLowerCase(), column]));
  const rawHeader = values[0] || [];
  const normalizedHeader = rawHeader.map((column) => {
    const trimmed = String(column || "").trim();
    return canonicalNames.get(trimmed.toLowerCase()) || trimmed;
  });
  const missingColumns = columns.filter((column) => !normalizedHeader.includes(column));
  const nextHeader = normalizedHeader.length ? [...normalizedHeader, ...missingColumns] : [...columns];
  const headerChanged =
    nextHeader.length !== rawHeader.length || nextHeader.some((column, index) => column !== rawHeader[index]);
  if (headerChanged) {
    const headerRange = `${sheetName}!A1:${columnName(nextHeader.length)}1`;
    const range = encodeURIComponent(headerRange);
    await sheetsFetch(`/values/${range}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ range: headerRange, majorDimension: "ROWS", values: [nextHeader] })
    });
  }
  sheetHeaders[sheetName] = nextHeader;
  return nextHeader;
}

function objectsToValues(rows, columns) {
  return [columns, ...rows.map((row) => columns.map((column) => row[column] ?? ""))];
}

function objectToValues(row, columns) {
  return columns.map((column) => row[column] ?? "");
}

function writeColumnsForSheet(sheetName) {
  return sheetHeaders[sheetName]?.length ? sheetHeaders[sheetName] : SHEET_COLUMNS[sheetName];
}

function cacheSheet(sheetName, rows) {
  sheetCache[sheetName] = rows;
}

function stripInternal(row) {
  const { __rowNumber, ...clean } = row;
  return clean;
}

function dataFromSheetCache() {
  return {
    teams: (sheetCache.Teams || []).map(stripInternal).map(normalizeTeam),
    deals: (sheetCache.Deals || []).map(stripInternal).map(normalizeDeal),
    goals: (sheetCache.MonthlyGoals || []).map(stripInternal).map(normalizeGoal),
    roles: (sheetCache.UserRoles || []).map(stripInternal).map(normalizeRole),
    settings: Object.fromEntries((sheetCache.Settings || []).map(stripInternal).map((row) => [row.key, row.value]))
  };
}

export function getCachedData() {
  return allDataCache;
}

async function batchReadSheets(sheetNames = CORE_READ_SHEETS) {
  const ranges = sheetNames.map((sheetName) => `${sheetName}!A:${sheetName === "Settings" ? "B" : "Z"}`);
  const query = ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join("&");
  const payload = await sheetsFetch(`/values:batchGet?${query}`);
  for (const [index, sheetName] of sheetNames.entries()) {
    const columns = SHEET_COLUMNS[sheetName];
    const values = payload.valueRanges?.[index]?.values || [columns];
    const header = await ensureSheetHeaderColumns(sheetName, values);
    cacheSheet(sheetName, rowsToObjects([header, ...values.slice(1)], columns));
  }
  allDataCache = dataFromSheetCache();
  return allDataCache;
}

async function batchUpdateValues(updates) {
  if (!updates.length) return;
  const payload = await sheetsFetch(`/values:batchUpdate?valueInputOption=USER_ENTERED`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: updates
    })
  });
  if (Array.isArray(payload.responses) && payload.responses.length !== updates.length) {
    throw new Error("Google Sheets did not confirm every requested update.");
  }
  return payload;
}

export async function readSheet(sheetName, force = false) {
  if (!force && sheetCache[sheetName]) return sheetCache[sheetName];
  const columns = SHEET_COLUMNS[sheetName];
  const encoded = encodeURIComponent(`${sheetName}!A:Z`);
  const payload = await sheetsFetch(`/values/${encoded}`);
  const values = payload.values || [columns];
  const header = await ensureSheetHeaderColumns(sheetName, values);
  const rows = rowsToObjects([header, ...values.slice(1)], columns);
  cacheSheet(sheetName, rows);
  allDataCache = dataFromSheetCache();
  return rows;
}

export async function writeSheet(sheetName, rows) {
  const columns = SHEET_COLUMNS[sheetName];
  const clearRange = encodeURIComponent(`${sheetName}!A:Z`);
  const writeRange = encodeURIComponent(`${sheetName}!A1`);
  await sheetsFetch(`/values/${clearRange}:clear`, { method: "POST", body: JSON.stringify({}) });
  await sheetsFetch(`/values/${writeRange}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ range: `${sheetName}!A1`, majorDimension: "ROWS", values: objectsToValues(rows, columns) })
  });
  sheetHeaders[sheetName] = [...columns];
  cacheSheet(sheetName, rows);
  allDataCache = dataFromSheetCache();
}

export async function appendSheet(sheetName, rows) {
  const columns = writeColumnsForSheet(sheetName);
  const encoded = encodeURIComponent(`${sheetName}!A:Z`);
  const payload = await sheetsFetch(`/values/${encoded}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&includeValuesInResponse=true`, {
    method: "POST",
    body: JSON.stringify({ values: rows.map((row) => columns.map((column) => row[column] ?? "")) })
  });
  if (Number(payload.updates?.updatedRows || 0) !== rows.length) {
    throw new Error(`Google Sheets confirmed ${Number(payload.updates?.updatedRows || 0)} of ${rows.length} appended rows.`);
  }
  const returnedValues = payload.updates?.updatedData?.values || [];
  const idColumnIndex = columns.indexOf("id");
  if (returnedValues.length && idColumnIndex >= 0) {
    const returnedIds = returnedValues.map((values) => String(values[idColumnIndex] || "").trim());
    const missingReceiptIds = rows.filter((row) => !returnedIds.includes(String(row.id || "").trim()));
    if (missingReceiptIds.length) {
      throw new Error("Google Sheets appended a row but returned an unexpected ID. The live sheet column order needs attention.");
    }
  }
  cacheSheet(sheetName, [...(sheetCache[sheetName] || []), ...rows]);
  allDataCache = dataFromSheetCache();
  return payload;
}

async function confirmPersistedRows(sheetName, expectedRows) {
  let confirmedRows = [];
  let confirmedById = new Map();
  let missing = expectedRows;
  const retryDelays = [0, 300, 900];
  for (const delay of retryDelays) {
    if (delay) await sleep(delay);
    confirmedRows = await readSheet(sheetName, true);
    confirmedById = new Map(confirmedRows.map((row) => [String(row.id || "").trim(), row]));
    missing = expectedRows.filter((row) => !confirmedById.has(String(row.id || "").trim()));
    if (!missing.length) break;
  }
  if (missing.length) {
    throw new Error(
      `Google Sheets did not return ${missing.length} saved ${sheetName === "Deals" ? "deal" : "record"}${missing.length === 1 ? "" : "s"}. Please retry; the form has been kept open.`
    );
  }
  return expectedRows.map((row) => confirmedById.get(String(row.id || "").trim()));
}

async function auditBestEffort(action, entityType, entityId, details) {
  try {
    await audit(action, entityType, entityId, details);
  } catch (error) {
    console.warn("Audit log write failed after the main Google Sheets save succeeded.", error);
  }
}

export async function ensureSheets() {
  const metadata = await sheetsFetch("?fields=sheets.properties");
  const existing = new Set(metadata.sheets.map((sheet) => sheet.properties.title));
  const requests = Object.keys(SHEET_COLUMNS)
    .filter((title) => !existing.has(title))
    .map((title) => ({ addSheet: { properties: { title } } }));
  if (requests.length) await sheetsFetch(":batchUpdate", { method: "POST", body: JSON.stringify({ requests }) });
  await Promise.all(
    Object.keys(SHEET_COLUMNS).map(async (sheetName) => {
      const rows = await readSheet(sheetName).catch(() => []);
      if (!rows.length) await writeSheet(sheetName, []);
    })
  );
}

export async function createDatabaseSpreadsheet(title = "MIDAS Sales Forecast Database") {
  if (!accessToken) await signIn();
  const response = await fetch(API_ROOT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: { title },
      sheets: Object.keys(SHEET_COLUMNS).map((sheetTitle) => ({ properties: { title: sheetTitle } }))
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Could not create spreadsheet.");
  setSpreadsheetId(payload.spreadsheetId);
  await ensureSheets();
  return payload;
}

export function normalizeTeam(row) {
  return {
    ...row,
    krwRate: Number(row.krwRate || 0),
    reps: JSON.parse(row.repsJson || "[]")
  };
}

export function normalizeDeal(row) {
  return {
    ...row,
    year: Number(row.year || 0),
    month: Number(row.month || 0),
    minAmount: Number(row.minAmount || 0),
    maxAmount: Number(row.maxAmount || 0),
    probability: Number(row.probability || 0),
    closedAmount: row.closedAmount === "" ? "" : Number(row.closedAmount || 0),
    hubspotDealUrl: String(row.hubspotDealUrl || "").trim(),
    repComment: row.repComment || row.comments || "",
    managerComment: row.managerComment || ""
  };
}

export function normalizeGoal(row) {
  return {
    ...row,
    year: Number(row.year || 0),
    month: Number(row.month || 0),
    targetAmount: Number(row.targetAmount || 0)
  };
}

export function normalizeRole(row) {
  const role = normalizeRoleValue(row.role);
  return {
    ...row,
    email: String(row.email || "").trim().toLowerCase(),
    role,
    teamId: row.teamId || "",
    repName: row.repName || "",
    googleSub: String(row.googleSub || "").trim()
  };
}

export async function readAllData() {
  const email = await refreshUserEmail();
  let data;
  try {
    data = await batchReadSheets();
  } catch (error) {
    if (String(error.message || "").includes("Unable to parse range")) {
      await ensureSheets();
      data = await batchReadSheets();
    } else {
      throw error;
    }
  }
  let roles = data.roles || [];
  if (email && !roles.some((role) => role.email === email)) {
    const timestamp = nowIso();
    const newRole = {
      id: createId("role"),
      email,
      role: "Manager",
      teamId: "",
      repName: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      googleSub: getUserGoogleSub()
    };
    const sheetRole = newRole;
    await appendSheet("UserRoles", [sheetRole]);
    roles = [...roles, normalizeRole(sheetRole)];
    await audit("User auto-added as Manager", "UserRoles", newRole.id, { email });
  }
  allDataCache = { ...data, roles };
  return allDataCache;
}

export async function audit(action, entityType, entityId, details = {}) {
  if (!AUDIT_ENABLED) return;
  await appendSheet("AuditLog", [
    {
      id: createId("audit"),
      timestamp: nowIso(),
      userEmail: signedInEmail,
      action,
      entityType,
      entityId,
      detailsJson: JSON.stringify(details)
    }
  ]);
}

function columnName(index) {
  let name = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

async function updateSheetRow(sheetName, rowIndex, row) {
  const columns = writeColumnsForSheet(sheetName);
  const rowNumber = row.__rowNumber || rowIndex + 2;
  const range = `${sheetName}!A${rowNumber}:${columnName(columns.length)}${rowNumber}`;
  await batchUpdateValues([{ range, majorDimension: "ROWS", values: [objectToValues(row, columns)] }]);
}

function findRowIndexById(rows, id) {
  const expectedId = String(id || "").trim();
  const directIndex = rows.findIndex((item) => String(item.id || "").trim() === expectedId);
  if (directIndex >= 0 || !expectedId) return directIndex;
  return rows.findIndex((item) =>
    Object.entries(item).some(
      ([key, value]) => key !== "__rowNumber" && String(value || "").trim() === expectedId
    )
  );
}

export async function upsertRow(sheetName, row, actionLabel) {
  const rows = await readSheet(sheetName);
  const timestamp = nowIso();
  const next = { ...row, id: row.id || createId(sheetName.toLowerCase()), updatedAt: timestamp };
  if (!next.createdAt) next.createdAt = timestamp;
  const index = findRowIndexById(rows, next.id);
  if (index >= 0) {
    const merged = { ...rows[index], ...next };
    await updateSheetRow(sheetName, index, merged);
    cacheSheet(sheetName, rows.map((item, rowIndex) => (rowIndex === index ? merged : item)));
  } else {
    await appendSheet(sheetName, [next]);
  }
  const [confirmed] = await confirmPersistedRows(sheetName, [next]);
  allDataCache = dataFromSheetCache();
  await auditBestEffort(actionLabel || (index >= 0 ? `${sheetName} updated` : `${sheetName} created`), sheetName, next.id, next);
  return stripInternal(confirmed);
}

export async function deleteRow(sheetName, id, actionLabel) {
  const rows = await readSheet(sheetName);
  const index = rows.findIndex((row) => row.id === id);
  if (index >= 0) {
    const rowNumber = rows[index].__rowNumber || index + 2;
    const clearRange = encodeURIComponent(`${sheetName}!A${rowNumber}:Z${rowNumber}`);
    await sheetsFetch(`/values/${clearRange}:clear`, { method: "POST", body: JSON.stringify({}) });
    cacheSheet(
      sheetName,
      rows.filter((row) => row.id !== id)
    );
    allDataCache = dataFromSheetCache();
  }
  await audit(actionLabel || `${sheetName} deleted`, sheetName, id, {});
}

export async function upsertRows(sheetName, incomingRows, keyFn, actionLabel) {
  const rows = await readSheet(sheetName);
  const timestamp = nowIso();
  const nextRows = [...rows];
  const updates = [];
  const appends = [];
  const writtenRows = [];
  const writeColumns = writeColumnsForSheet(sheetName);
  let added = 0;
  let updated = 0;
  const indexByKey = new Map(rows.map((row, index) => [keyFn(row), index]));

  incomingRows.forEach((row) => {
    const key = keyFn(row);
    const existingIndex = indexByKey.get(key);
    if (existingIndex >= 0) {
      const merged = {
        ...nextRows[existingIndex],
        ...row,
        id: nextRows[existingIndex].id || row.id || createId(sheetName.toLowerCase()),
        updatedAt: timestamp
      };
      nextRows[existingIndex] = merged;
      const rowNumber = merged.__rowNumber || existingIndex + 2;
      updates.push({
        range: `${sheetName}!A${rowNumber}:${columnName(writeColumns.length)}${rowNumber}`,
        majorDimension: "ROWS",
        values: [objectToValues(merged, writeColumns)]
      });
      writtenRows.push(merged);
      updated += 1;
    } else {
      const next = { ...row, id: row.id || createId(sheetName.toLowerCase()), createdAt: row.createdAt || timestamp, updatedAt: timestamp };
      indexByKey.set(key, nextRows.length);
      nextRows.push(next);
      appends.push(next);
      writtenRows.push(next);
      added += 1;
    }
  });

  await batchUpdateValues(updates);
  if (appends.length) await appendSheet(sheetName, appends);
  else {
    cacheSheet(sheetName, nextRows);
    allDataCache = dataFromSheetCache();
  }
  if (appends.length) {
    cacheSheet(sheetName, nextRows);
    allDataCache = dataFromSheetCache();
  }
  const confirmedRows = await confirmPersistedRows(sheetName, writtenRows);
  await auditBestEffort(actionLabel || `${sheetName} bulk upserted`, sheetName, "bulk", { added, updated });
  return { added, updated, rows: confirmedRows.map(stripInternal) };
}

export async function replaceSheetData(data) {
  await Promise.all([
    writeSheet("Teams", (data.teams || []).map((team) => ({ ...team, repsJson: team.repsJson || JSON.stringify(team.reps || []) }))),
    writeSheet("Deals", data.deals || []),
    writeSheet("MonthlyGoals", data.goals || []),
    writeSheet("UserRoles", data.roles || data.userRoles || []),
    writeSheet("Settings", Object.entries(data.settings || {}).map(([key, value]) => ({ key, value })))
  ]);
  await audit("JSON backup imported", "Backup", "full", {});
}

export async function updateSettings(settings) {
  await writeSheet(
    "Settings",
    Object.entries(settings).map(([key, value]) => ({ key, value }))
  );
  await audit("Settings updated", "Settings", "settings", settings);
}
