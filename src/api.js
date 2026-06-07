import {
  audit,
  createDatabaseSpreadsheet,
  consumeRedirectToken,
  deleteRow,
  getSpreadsheetId,
  getUserEmail,
  hasGoogleConfig,
  isSignedIn,
  readAllData,
  readSheet,
  replaceSheetData,
  redirectSignIn,
  setSpreadsheetId,
  signIn,
  signOut,
  updateSettings,
  upsertRow,
  writeSheet
} from "./api/googleSheets.js";
import { downloadText, parseCsvFile, toCsv } from "./utils/csv.js";
import { createId, nowIso } from "./utils/ids.js";
import { monthToNumber, toNumber } from "./utils/calculations.js";

const CATEGORIES = ["MODS", "Non-MODS", "New Sales"];
const STATUSES = ["Open", "Closed", "Lost", "Long-Term"];
const TEMPERATURES = ["High", "Medium", "Low"];
const GOAL_TYPES = ["Responsibility Goal", "Challenge Goal"];

function teamToSheet(team) {
  return {
    ...team,
    repsJson: team.repsJson || JSON.stringify(Array.isArray(team.reps) ? team.reps : String(team.reps || "").split(",").map((rep) => rep.trim()).filter(Boolean))
  };
}

function cleanDeal(deal) {
  const status = deal.status || "Open";
  const maxAmount = toNumber(deal.maxAmount);
  return {
    ...deal,
    year: toNumber(deal.year),
    month: monthToNumber(deal.month),
    minAmount: toNumber(deal.minAmount),
    maxAmount,
    probability: toNumber(deal.probability),
    closedAmount: status === "Closed" ? toNumber(deal.closedAmount || maxAmount) : 0
  };
}

function cleanGoal(goal) {
  return {
    ...goal,
    year: toNumber(goal.year),
    month: monthToNumber(goal.month),
    targetAmount: toNumber(goal.targetAmount)
  };
}

function goalKey(goal) {
  return [goal.teamId, goal.repName, goal.year, goal.month, goal.category, goal.goalType].map((part) => String(part || "").toLowerCase()).join("|");
}

function emptyPreview() {
  return {
    validRows: [],
    errorRows: [],
    duplicateRows: [],
    warnings: [],
    summary: { added: 0, updated: 0, skipped: 0 }
  };
}

function pushPreviewRow(preview, row) {
  if (row.warnings?.length) preview.warnings.push({ rowNumber: row.rowNumber, warnings: row.warnings });
  if (row.errors.length) preview.errorRows.push(row);
  else {
    preview.validRows.push(row);
    if (row.duplicate) preview.duplicateRows.push(row);
  }
}

function summarize(preview) {
  preview.summary.added = preview.validRows.filter((row) => row.action === "add").length;
  preview.summary.updated = preview.validRows.filter((row) => row.action === "update").length;
  preview.summary.skipped = preview.errorRows.length;
  return preview;
}

async function previewTeams(file) {
  const rows = await parseCsvFile(file);
  const existing = new Map((await api.getTeams()).map((team) => [team.teamName.toLowerCase(), team]));
  const seen = new Set();
  const preview = emptyPreview();
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const teamName = String(row.teamName || "").trim();
    const errors = [];
    const warnings = [];
    if (!teamName) errors.push("teamName is required.");
    if (!row.teamLead) errors.push("teamLead is required.");
    if (!row.region) errors.push("region is required.");
    if (!/^[A-Za-z]{3}$/.test(String(row.currency || ""))) errors.push("currency must be a short currency code.");
    if (!Number.isFinite(Number(row.krwRate))) errors.push("krwRate must be a number.");
    const existingTeam = existing.get(teamName.toLowerCase());
    const duplicate = Boolean(existingTeam || seen.has(teamName.toLowerCase()));
    seen.add(teamName.toLowerCase());
    pushPreviewRow(preview, {
      id: `${rowNumber}`,
      rowNumber,
      action: existingTeam ? "update" : "add",
      duplicate,
      errors,
      warnings,
      data: {
        id: existingTeam?.id || row.id || createId("team"),
        teamName,
        teamLead: row.teamLead,
        region: row.region,
        currency: String(row.currency || "GBP").toUpperCase(),
        krwRate: toNumber(row.krwRate),
        reps: String(row.reps || "").split(",").map((rep) => rep.trim()).filter(Boolean)
      }
    });
  });
  return summarize(preview);
}

async function previewDeals(file) {
  const rows = await parseCsvFile(file);
  const teams = await api.getTeams();
  const deals = await api.getDeals();
  const teamsByName = new Map(teams.map((team) => [team.teamName.toLowerCase(), team]));
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const seen = new Set();
  const preview = emptyPreview();
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const errors = [];
    const warnings = [];
    const teamName = String(row.teamName || "").trim();
    const team = teamsByName.get(teamName.toLowerCase());
    const year = toNumber(row.year);
    const month = monthToNumber(row.month);
    const minAmount = toNumber(row.minAmount);
    const maxAmount = toNumber(row.maxAmount);
    const probability = toNumber(row.probability);
    if (year < 2000 || year > 2100) errors.push("year must be valid.");
    if (!month) errors.push("month must be 1-12 or a valid month name.");
    if (!team) errors.push(`teamName '${teamName}' does not match an existing team.`);
    if (!CATEGORIES.includes(row.category)) errors.push("category must be MODS, Non-MODS, or New Sales.");
    if (!STATUSES.includes(row.status)) errors.push("status must be Open, Closed, Lost, or Long-Term.");
    if (!TEMPERATURES.includes(row.temperature)) errors.push("temperature must be High, Medium, or Low.");
    if (!Number.isFinite(Number(row.minAmount))) errors.push("minAmount must be a number.");
    if (!Number.isFinite(Number(row.maxAmount))) errors.push("maxAmount must be a number.");
    if (maxAmount < minAmount) errors.push("maxAmount cannot be lower than minAmount.");
    if (probability < 0 || probability > 100) errors.push("probability must be 0-100.");
    const key = [year, month, teamName, row.repName, row.companyName, row.product, row.category, row.dealType].map((part) => String(part || "").toLowerCase()).join("|");
    const existingDeal = deals.find((deal) => {
      const dealTeam = teamsById.get(deal.teamId);
      return [deal.year, deal.month, dealTeam?.teamName, deal.repName, deal.companyName, deal.product, deal.category, deal.dealType]
        .map((part) => String(part || "").toLowerCase())
        .join("|") === key;
    });
    const duplicate = Boolean(existingDeal || seen.has(key));
    seen.add(key);
    pushPreviewRow(preview, {
      id: `${rowNumber}`,
      rowNumber,
      action: existingDeal ? "update" : "add",
      duplicate,
      errors,
      warnings,
      data: cleanDeal({
        id: existingDeal?.id || row.id || createId("deal"),
        teamId: team?.id || "",
        repName: row.repName,
        year,
        month,
        companyName: row.companyName,
        product: row.product,
        category: row.category,
        dealType: row.dealType,
        minAmount,
        maxAmount,
        probability,
        temperature: row.temperature,
        status: row.status,
        closedAmount: row.closedAmount,
        expectedCloseDate: row.expectedCloseDate,
        comments: row.comments,
        nextAction: row.nextAction
      })
    });
  });
  return summarize(preview);
}

async function previewGoals(file) {
  const rows = await parseCsvFile(file);
  const teams = await api.getTeams();
  const goals = await api.getGoals();
  const teamsByName = new Map(teams.map((team) => [team.teamName.toLowerCase(), team]));
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const seen = new Set();
  const preview = emptyPreview();
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const errors = [];
    const warnings = [];
    const teamName = String(row.teamName || "").trim();
    const team = teamsByName.get(teamName.toLowerCase());
    const year = toNumber(row.year);
    const month = monthToNumber(row.month);
    if (year < 2000 || year > 2100) errors.push("year must be valid.");
    if (!month) errors.push("month must be 1-12 or a valid month name.");
    if (!team) errors.push(`teamName '${teamName}' does not match an existing team.`);
    if (!CATEGORIES.includes(row.category)) errors.push("category must be MODS, Non-MODS, or New Sales.");
    if (!GOAL_TYPES.includes(row.goalType)) errors.push("goalType must be Responsibility Goal or Challenge Goal.");
    if (!Number.isFinite(Number(row.targetAmount))) errors.push("targetAmount must be a number.");
    const key = [year, month, teamName, row.repName, row.category, row.goalType].map((part) => String(part || "").toLowerCase()).join("|");
    const existingGoal = goals.find((goal) => {
      const goalTeam = teamsById.get(goal.teamId);
      return [goal.year, goal.month, goalTeam?.teamName, goal.repName, goal.category, goal.goalType]
        .map((part) => String(part || "").toLowerCase())
        .join("|") === key;
    });
    const duplicate = Boolean(existingGoal || seen.has(key));
    seen.add(key);
    pushPreviewRow(preview, {
      id: `${rowNumber}`,
      rowNumber,
      action: existingGoal ? "update" : "add",
      duplicate,
      errors,
      warnings,
      data: cleanGoal({
        id: existingGoal?.id || row.id || createId("goal"),
        teamId: team?.id || "",
        repName: row.repName,
        year,
        month,
        category: row.category,
        goalType: row.goalType,
        targetAmount: row.targetAmount
      })
    });
  });
  return summarize(preview);
}

export const api = {
  authStatus: async () => ({
    passwordRequired: true,
    authenticated: isSignedIn(),
    hasGoogleConfig: hasGoogleConfig(),
    spreadsheetId: getSpreadsheetId()
  }),
  login: () => signIn(),
  logout: async () => signOut(),
  redirectLogin: () => redirectSignIn(),
  consumeRedirectToken,

  getSpreadsheetId,
  setSpreadsheetId,
  getUserEmail,
  readAllData,

  getTeams: async () => (await readAllData()).teams,
  createTeam: async (team) => upsertRow("Teams", teamToSheet(team), "Team created"),
  updateTeam: async (id, team) => upsertRow("Teams", teamToSheet({ ...team, id }), "Team updated"),
  deleteTeam: async (id) => deleteRow("Teams", id, "Team deleted"),

  getDeals: async () => (await readAllData()).deals,
  createDeal: async (deal) => upsertRow("Deals", cleanDeal(deal), "Deal created"),
  updateDeal: async (id, deal) => upsertRow("Deals", cleanDeal({ ...deal, id }), "Deal updated"),
  deleteDeal: async (id) => deleteRow("Deals", id, "Deal deleted"),

  getGoals: async () => (await readAllData()).goals,
  createGoal: async (goal) => upsertRow("MonthlyGoals", cleanGoal(goal), "Goal created"),
  updateGoal: async (id, goal) => upsertRow("MonthlyGoals", cleanGoal({ ...goal, id }), "Goal updated"),
  createGoalsBulk: async (goals) => {
    const existingRows = await readSheet("MonthlyGoals");
    const timestamp = nowIso();
    let added = 0;
    let updated = 0;
    const nextRows = [...existingRows];
    const indexByKey = new Map(existingRows.map((goal, index) => [goalKey(goal), index]));

    goals.map(cleanGoal).forEach((goal) => {
      const key = goalKey(goal);
      const existingIndex = indexByKey.get(key);
      if (existingIndex >= 0) {
        nextRows[existingIndex] = { ...nextRows[existingIndex], ...goal, id: nextRows[existingIndex].id || goal.id || createId("goal"), updatedAt: timestamp };
        updated += 1;
      } else {
        indexByKey.set(key, nextRows.length);
        nextRows.push({ ...goal, id: goal.id || createId("goal"), createdAt: goal.createdAt || timestamp, updatedAt: timestamp });
        added += 1;
      }
    });

    await writeSheet("MonthlyGoals", nextRows);
    await audit("Bulk monthly goals saved", "MonthlyGoals", "bulk", { added, updated });
    return { added, updated };
  },
  deleteGoal: async (id) => deleteRow("MonthlyGoals", id, "Goal deleted"),

  exportJson: () => readAllData(),
  importJson: (data) => replaceSheetData(data),
  createBackup: async () => {
    const data = await readAllData();
    downloadText(`midas-sales-full-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
    return { filename: "Downloaded JSON backup" };
  },

  exportCsv: async (type) => {
    const data = await readAllData();
    if (type === "teams") {
      const rows = data.teams.map((team) => ({ ...team, reps: team.reps.join(", ") }));
      downloadText("midas-teams.csv", toCsv(rows, ["id", "teamName", "teamLead", "region", "currency", "krwRate", "reps"]), "text/csv;charset=utf-8");
    }
    if (type === "deals") {
      const teams = new Map(data.teams.map((team) => [team.id, team]));
      const rows = data.deals.map((deal) => ({ ...deal, teamName: teams.get(deal.teamId)?.teamName || "" }));
      downloadText("midas-deals.csv", toCsv(rows, ["id", "year", "month", "teamName", "repName", "companyName", "product", "category", "dealType", "minAmount", "maxAmount", "probability", "temperature", "status", "closedAmount", "expectedCloseDate", "comments", "nextAction"]), "text/csv;charset=utf-8");
    }
    if (type === "goals") {
      const teams = new Map(data.teams.map((team) => [team.id, team]));
      const rows = data.goals.map((goal) => ({ ...goal, teamName: teams.get(goal.teamId)?.teamName || "" }));
      downloadText("midas-monthly-goals.csv", toCsv(rows, ["id", "year", "month", "teamName", "repName", "category", "goalType", "targetAmount"]), "text/csv;charset=utf-8");
    }
  },

  previewCsv: async (type, file) => {
    if (type === "teams") return previewTeams(file);
    if (type === "deals") return previewDeals(file);
    if (type === "goals") return previewGoals(file);
    throw new Error("Unknown CSV type.");
  },
  importCsv: async (type, file) => {
    const preview = await api.previewCsv(type, file);
    if (preview.errorRows.length) throw new Error("CSV contains validation errors.");
    if (type === "teams") {
      for (const row of preview.validRows) await api.updateTeam(row.data.id, row.data);
      await audit("CSV imported", "Teams", "csv", preview.summary);
    }
    if (type === "deals") {
      for (const row of preview.validRows) await api.updateDeal(row.data.id, row.data);
      await audit("CSV imported", "Deals", "csv", preview.summary);
    }
    if (type === "goals") {
      for (const row of preview.validRows) await api.updateGoal(row.data.id, row.data);
      await audit("CSV imported", "MonthlyGoals", "csv", preview.summary);
    }
    return { ok: true, summary: preview.summary };
  },

  updateSettings,
  createSpreadsheet: createDatabaseSpreadsheet
};

export function downloadFile(path) {
  if (path.includes("teams")) return api.exportCsv("teams");
  if (path.includes("deals")) return api.exportCsv("deals");
  if (path.includes("goals")) return api.exportCsv("goals");
}
