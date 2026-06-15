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
    "managerComment"
  ],
  MonthlyGoals: ["id", "teamId", "repName", "year", "month", "category", "goalType", "targetAmount", "createdAt", "updatedAt"],
  UserRoles: ["id", "email", "role", "teamId", "repName", "createdAt", "updatedAt"],
  Settings: ["key", "value"],
  AuditLog: ["id", "timestamp", "userEmail", "action", "entityType", "entityId", "detailsJson"]
};

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email";
const API_ROOT = "https://sheets.googleapis.com/v4/spreadsheets";
const AUDIT_ENABLED = import.meta.env.VITE_ENABLE_AUDIT_LOG === "true";

let tokenClient = null;
let accessToken = sessionStorage.getItem("midas-google-access-token") || "";
let signedInEmail = "";
let spreadsheetId = extractSpreadsheetId(import.meta.env.VITE_DEFAULT_SPREADSHEET_ID || localStorage.getItem("midas-google-spreadsheet-id") || "");
let allDataCache = null;
const sheetCache = {};
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
  return signedInEmail;
}

async function refreshUserEmail() {
  if (!accessToken || signedInEmail) return signedInEmail;
  try {
    const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then((res) => res.json());
    signedInEmail = profile.email || "";
  } catch {
    signedInEmail = "";
  }
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
        reject(new Error(`Google Identity Services did not load. Disable blockers for accounts.google.com and confirm ${window.location.origin} is an authorized JavaScript origin for this OAuth client.`));
      }
    }, 100);
  });
}

export async function signIn() {
  if (!clientId()) throw new Error("Missing VITE_GOOGLE_CLIENT_ID.");
  await waitForGoogle();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`Google sign-in did not finish. Allow popups for ${window.location.origin}, then try again.`));
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
  if (!accessToken) await signIn();
  if (!spreadsheetId) throw new Error("Set VITE_DEFAULT_SPREADSHEET_ID in the app environment first.");
  const method = options.method || "GET";
  const label = requestLabel(path, method);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (import.meta.env.DEV) console.info(`[Sheets API] ${new Date().toISOString()} ${label}`);
    const response = await fetch(`${API_ROOT}/${spreadsheetId}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) return payload;
    if (response.status === 429 && attempt < 4) {
      const waitMs = 1000 * 2 ** attempt + Math.floor(Math.random() * 350);
      await sleep(waitMs);
      continue;
    }
    const message =
      response.status === 429
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
    .map((row, rowIndex) =>
      columns.reduce(
        (record, column) => {
        const index = header.indexOf(column);
        record[column] = index >= 0 ? row[index] ?? "" : "";
        return record;
        },
        { __rowNumber: rowIndex + 2 }
      )
    )
    .filter((row) => Object.keys(row).some((key) => key !== "__rowNumber" && String(row[key] || "").trim() !== ""));
}

function headerNeedsUpgrade(values = [], columns = []) {
  const header = values[0] || [];
  return columns.some((column) => !header.includes(column));
}

async function ensureSheetHeaderColumns(sheetName, values = []) {
  const columns = SHEET_COLUMNS[sheetName];
  if (!columns || !headerNeedsUpgrade(values, columns)) return;
  const range = encodeURIComponent(`${sheetName}!A1:${columnName(columns.length)}1`);
  await sheetsFetch(`/values/${range}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ range: `${sheetName}!A1`, majorDimension: "ROWS", values: [columns] })
  });
}

function objectsToValues(rows, columns) {
  return [columns, ...rows.map((row) => columns.map((column) => row[column] ?? ""))];
}

function objectToValues(row, columns) {
  return columns.map((column) => row[column] ?? "");
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
    await ensureSheetHeaderColumns(sheetName, values);
    cacheSheet(sheetName, rowsToObjects(values, columns));
  }
  allDataCache = dataFromSheetCache();
  return allDataCache;
}

async function batchUpdateValues(updates) {
  if (!updates.length) return;
  await sheetsFetch(`/values:batchUpdate?valueInputOption=USER_ENTERED`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: updates
    })
  });
}

export async function readSheet(sheetName) {
  if (sheetCache[sheetName]) return sheetCache[sheetName];
  const columns = SHEET_COLUMNS[sheetName];
  const encoded = encodeURIComponent(`${sheetName}!A:Z`);
  const payload = await sheetsFetch(`/values/${encoded}`);
  await ensureSheetHeaderColumns(sheetName, payload.values || [columns]);
  const rows = rowsToObjects(payload.values || [columns], columns);
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
  cacheSheet(sheetName, rows);
  allDataCache = dataFromSheetCache();
}

export async function appendSheet(sheetName, rows) {
  const columns = SHEET_COLUMNS[sheetName];
  const encoded = encodeURIComponent(`${sheetName}!A:Z`);
  await sheetsFetch(`/values/${encoded}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: rows.map((row) => columns.map((column) => row[column] ?? "")) })
  });
  cacheSheet(sheetName, [...(sheetCache[sheetName] || []), ...rows]);
  allDataCache = dataFromSheetCache();
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
  const role = row.role === "Manager" ? "Manager" : "Team Member";
  return {
    ...row,
    email: String(row.email || "").trim().toLowerCase(),
    role,
    teamId: row.teamId || "",
    repName: row.repName || ""
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
      updatedAt: timestamp
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
  const columns = SHEET_COLUMNS[sheetName];
  const rowNumber = row.__rowNumber || rowIndex + 2;
  const range = `${sheetName}!A${rowNumber}:${columnName(columns.length)}${rowNumber}`;
  await batchUpdateValues([{ range, majorDimension: "ROWS", values: [objectToValues(row, columns)] }]);
}

export async function upsertRow(sheetName, row, actionLabel) {
  const rows = await readSheet(sheetName);
  const timestamp = nowIso();
  const next = { ...row, id: row.id || createId(sheetName.toLowerCase()), updatedAt: timestamp };
  if (!next.createdAt) next.createdAt = timestamp;
  const index = rows.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    const merged = { ...rows[index], ...next };
    await updateSheetRow(sheetName, index, merged);
    cacheSheet(sheetName, rows.map((item, rowIndex) => (rowIndex === index ? merged : item)));
  } else {
    await appendSheet(sheetName, [next]);
  }
  allDataCache = dataFromSheetCache();
  await audit(actionLabel || (index >= 0 ? `${sheetName} updated` : `${sheetName} created`), sheetName, next.id, next);
  return next;
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
        range: `${sheetName}!A${rowNumber}:${columnName(SHEET_COLUMNS[sheetName].length)}${rowNumber}`,
        majorDimension: "ROWS",
        values: [objectToValues(merged, SHEET_COLUMNS[sheetName])]
      });
      updated += 1;
    } else {
      const next = { ...row, id: row.id || createId(sheetName.toLowerCase()), createdAt: row.createdAt || timestamp, updatedAt: timestamp };
      indexByKey.set(key, nextRows.length);
      nextRows.push(next);
      appends.push(next);
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
  await audit(actionLabel || `${sheetName} bulk upserted`, sheetName, "bulk", { added, updated });
  return { added, updated, rows: incomingRows };
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
