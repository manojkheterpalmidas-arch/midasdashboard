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
    "updatedAt"
  ],
  MonthlyGoals: ["id", "teamId", "repName", "year", "month", "category", "goalType", "targetAmount", "createdAt", "updatedAt"],
  Settings: ["key", "value"],
  AuditLog: ["id", "timestamp", "userEmail", "action", "entityType", "entityId", "detailsJson"]
};

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const API_ROOT = "https://sheets.googleapis.com/v4/spreadsheets";

let tokenClient = null;
let accessToken = sessionStorage.getItem("midas-google-access-token") || "";
let signedInEmail = "";
let spreadsheetId = extractSpreadsheetId(import.meta.env.VITE_DEFAULT_SPREADSHEET_ID || localStorage.getItem("midas-google-spreadsheet-id") || "");

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
  return signedInEmail;
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
  accessToken = token;
  sessionStorage.setItem("midas-google-access-token", accessToken);
  sessionStorage.setItem("midas-google-session", "true");
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
        reject(new Error("Google Identity Services did not load. Disable blockers for accounts.google.com and confirm http://localhost:5173 is an authorized JavaScript origin for this OAuth client."));
      }
    }, 100);
  });
}

export async function signIn() {
  if (!clientId()) throw new Error("Missing VITE_GOOGLE_CLIENT_ID.");
  await waitForGoogle();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Google sign-in did not finish. Allow popups for localhost:5173, then try again."));
    }, 60000);
    tokenClient =
      window.google.accounts.oauth2.initTokenClient({
        client_id: clientId(),
        scope: SHEETS_SCOPE,
        prompt: "",
        error_callback: (error) => {
          window.clearTimeout(timeout);
          reject(new Error(error?.message || error?.type || "Google sign-in was blocked or cancelled."));
        },
        callback: async (response) => {
          window.clearTimeout(timeout);
          if (response.error) return reject(new Error(response.error));
          accessToken = response.access_token;
          sessionStorage.setItem("midas-google-access-token", accessToken);
          sessionStorage.setItem("midas-google-session", "true");
          try {
            const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` }
            }).then((res) => res.json());
            signedInEmail = profile.email || "";
          } catch {
            signedInEmail = "";
          }
          resolve({ ok: true, email: signedInEmail });
        }
      });
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

export function isSignedIn() {
  return Boolean(accessToken);
}

export function signOut() {
  accessToken = "";
  signedInEmail = "";
  sessionStorage.removeItem("midas-google-access-token");
  sessionStorage.removeItem("midas-google-session");
}

async function sheetsFetch(path, options = {}) {
  if (!accessToken) await signIn();
  if (!spreadsheetId) throw new Error("Set VITE_DEFAULT_SPREADSHEET_ID in the app environment first.");
  const response = await fetch(`${API_ROOT}/${spreadsheetId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Google Sheets request failed (${response.status}).`);
  return payload;
}

function rowsToObjects(values = [], columns) {
  const [header = columns, ...rows] = values;
  return rows
    .filter((row) => row.some((value) => String(value || "").trim() !== ""))
    .map((row) =>
      columns.reduce((record, column) => {
        const index = header.indexOf(column);
        record[column] = index >= 0 ? row[index] ?? "" : "";
        return record;
      }, {})
    );
}

function objectsToValues(rows, columns) {
  return [columns, ...rows.map((row) => columns.map((column) => row[column] ?? ""))];
}

export async function readSheet(sheetName) {
  const columns = SHEET_COLUMNS[sheetName];
  const encoded = encodeURIComponent(`${sheetName}!A:Z`);
  const payload = await sheetsFetch(`/values/${encoded}`);
  return rowsToObjects(payload.values || [columns], columns);
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
}

export async function appendSheet(sheetName, rows) {
  const columns = SHEET_COLUMNS[sheetName];
  const encoded = encodeURIComponent(`${sheetName}!A:Z`);
  await sheetsFetch(`/values/${encoded}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: rows.map((row) => columns.map((column) => row[column] ?? "")) })
  });
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
    closedAmount: row.closedAmount === "" ? "" : Number(row.closedAmount || 0)
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

export async function readAllData() {
  await ensureSheets();
  const [teams, deals, goals, settings] = await Promise.all([
    readSheet("Teams"),
    readSheet("Deals"),
    readSheet("MonthlyGoals"),
    readSheet("Settings")
  ]);
  return {
    teams: teams.map(normalizeTeam),
    deals: deals.map(normalizeDeal),
    goals: goals.map(normalizeGoal),
    settings: Object.fromEntries(settings.map((row) => [row.key, row.value]))
  };
}

export async function audit(action, entityType, entityId, details = {}) {
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

export async function upsertRow(sheetName, row, actionLabel) {
  const rows = await readSheet(sheetName);
  const timestamp = nowIso();
  const next = { ...row, id: row.id || createId(sheetName.toLowerCase()), updatedAt: timestamp };
  if (!next.createdAt) next.createdAt = timestamp;
  const index = rows.findIndex((item) => item.id === next.id);
  const nextRows = index >= 0 ? rows.map((item, rowIndex) => (rowIndex === index ? { ...item, ...next } : item)) : [...rows, next];
  await writeSheet(sheetName, nextRows);
  await audit(actionLabel || (index >= 0 ? `${sheetName} updated` : `${sheetName} created`), sheetName, next.id, next);
  return next;
}

export async function deleteRow(sheetName, id, actionLabel) {
  const rows = await readSheet(sheetName);
  await writeSheet(
    sheetName,
    rows.filter((row) => row.id !== id)
  );
  await audit(actionLabel || `${sheetName} deleted`, sheetName, id, {});
}

export async function replaceSheetData(data) {
  await Promise.all([
    writeSheet("Teams", (data.teams || []).map((team) => ({ ...team, repsJson: team.repsJson || JSON.stringify(team.reps || []) }))),
    writeSheet("Deals", data.deals || []),
    writeSheet("MonthlyGoals", data.goals || []),
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
