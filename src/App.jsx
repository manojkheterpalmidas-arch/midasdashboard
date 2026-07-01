import React, { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api } from "./api.js";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const YEARS = [2025, 2026, 2027, 2028];
const CATEGORIES = ["MODS", "Non-MODS", "New Sales"];
const DEAL_TYPES = ["Renewal", "Reactivation", "Upsell", "New Logo", "Cross-sell", "Other"];
const TEMPERATURES = ["High", "Medium", "Low"];
const STATUSES = ["Open", "Closed", "Lost", "Long-Term"];
const GOAL_TYPES = ["Responsibility Goal", "Challenge Goal"];
const CURRENCIES = ["KRW", "GBP", "EUR", "USD"];
const RATE_CURRENCIES = ["GBP", "EUR", "USD"];
const DEFAULT_KRW_RATES = { KRW: 1, GBP: 1850, EUR: 1580, USD: 1350 };
const PRIVILEGED_ROLES = ["Team Lead", "Manager"];
const MANAGER_COMMENT_UNLOCK_CODE = import.meta.env.VITE_MANAGER_COMMENT_UNLOCK_CODE || "";
const MANAGER_COMMENT_UNLOCK_KEY = "midas-manager-comment-unlocked";
const DEAL_DRAFT_KEY = "midas-unsaved-deal-draft";
const CHART_COLORS = ["#16825d", "#1d4f8f", "#d18b16", "#c24136", "#6d5bd0"];
const RADIAN = Math.PI / 180;
const TABS = ["Dashboard", "Teams", "Deals", "Monthly Goals", "Team View", "Team Performance", "Individual Performance", "Summary"];
const PERIOD_TYPES = ["Monthly", "Quarterly", "Half-Yearly"];
const QUARTERS = [
  { value: 1, label: "Q1", months: [1, 2, 3] },
  { value: 2, label: "Q2", months: [4, 5, 6] },
  { value: 3, label: "Q3", months: [7, 8, 9] },
  { value: 4, label: "Q4", months: [10, 11, 12] }
];
const HALF_YEARS = [
  { value: 1, label: "H1", months: [1, 2, 3, 4, 5, 6] },
  { value: 2, label: "H2", months: [7, 8, 9, 10, 11, 12] }
];
const CSV_FIELDS = [
  "entity",
  "id",
  "teamName",
  "teamLead",
  "region",
  "currency",
  "krwRate",
  "reps",
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
  "hubspotDealUrl",
  "comments",
  "repComment",
  "managerComment",
  "nextAction",
  "goalType",
  "targetAmount",
  "preparedBy",
  "lastUpdated"
];

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDemoData() {
  const teams = [
    {
      id: "team-uk",
      teamName: "UK Team",
      teamLead: "Manoj",
      region: "UK",
      currency: "GBP",
      krwRate: 1850,
      reps: ["Manoj", "Yeop"]
    },
    {
      id: "team-ireland",
      teamName: "Ireland Team",
      teamLead: "Manoj",
      region: "Ireland",
      currency: "GBP",
      krwRate: 1850,
      reps: ["Manoj"]
    },
    {
      id: "team-romania",
      teamName: "Romania Team",
      teamLead: "Michal",
      region: "Romania",
      currency: "EUR",
      krwRate: 1580,
      reps: ["Michal"]
    }
  ];

  const goals = [
    ["goal-uk-manoj-mods-resp", "Manoj", "MODS", "Responsibility Goal", 14125],
    ["goal-uk-manoj-nonmods-resp", "Manoj", "Non-MODS", "Responsibility Goal", 24000],
    ["goal-uk-yeop-newsales-resp", "Yeop", "New Sales", "Responsibility Goal", 9000],
    ["goal-uk-manoj-mods-chal", "Manoj", "MODS", "Challenge Goal", 16000],
    ["goal-uk-manoj-nonmods-chal", "Manoj", "Non-MODS", "Challenge Goal", 28000],
    ["goal-uk-yeop-newsales-chal", "Yeop", "New Sales", "Challenge Goal", 11000]
  ].map(([id, repName, category, goalType, targetAmount]) => ({
    id,
    teamId: "team-uk",
    repName,
    year: 2026,
    month: 6,
    category,
    goalType,
    targetAmount
  }));

  const deals = [
    {
      id: "deal-fairhurst-mods",
      teamId: "team-uk",
      repName: "Manoj",
      year: 2026,
      month: 6,
      companyName: "Fairhurst",
      product: "Civil NX",
      category: "MODS",
      dealType: "Renewal",
      minAmount: 9500,
      maxAmount: 12000,
      probability: 80,
      temperature: "High",
      status: "Open",
      closedAmount: "",
      expectedCloseDate: "",
      comments: "Strong renewal possibility",
      nextAction: "Follow up on quote"
    },
    {
      id: "deal-wentworth-mods",
      teamId: "team-uk",
      repName: "Manoj",
      year: 2026,
      month: 6,
      companyName: "Wentworth",
      product: "Civil NX",
      category: "MODS",
      dealType: "Renewal",
      minAmount: 4625,
      maxAmount: 6000,
      probability: 60,
      temperature: "Medium",
      status: "Open",
      closedAmount: "",
      expectedCloseDate: "",
      comments: "Waiting for confirmation",
      nextAction: "Call decision maker"
    },
    {
      id: "deal-dartford-nonmods",
      teamId: "team-uk",
      repName: "Manoj",
      year: 2026,
      month: 6,
      companyName: "Dartford",
      product: "Civil NX",
      category: "Non-MODS",
      dealType: "Upsell",
      minAmount: 1700,
      maxAmount: 3000,
      probability: 70,
      temperature: "High",
      status: "Open",
      closedAmount: "",
      expectedCloseDate: "",
      comments: "Upsell opportunity",
      nextAction: "Send revised offer"
    },
    {
      id: "deal-fairhurst-nonmods",
      teamId: "team-uk",
      repName: "Manoj",
      year: 2026,
      month: 6,
      companyName: "Fairhurst",
      product: "Civil NX",
      category: "Non-MODS",
      dealType: "Upsell",
      minAmount: 7000,
      maxAmount: 9000,
      probability: 80,
      temperature: "High",
      status: "Open",
      closedAmount: "",
      expectedCloseDate: "",
      comments: "Additional license discussion",
      nextAction: "Confirm procurement path"
    },
    {
      id: "deal-new-client-a",
      teamId: "team-uk",
      repName: "Yeop",
      year: 2026,
      month: 6,
      companyName: "New Client A",
      product: "Civil NX",
      category: "New Sales",
      dealType: "New Logo",
      minAmount: 0,
      maxAmount: 9000,
      probability: 30,
      temperature: "Low",
      status: "Open",
      closedAmount: "",
      expectedCloseDate: "",
      comments: "Early stage opportunity",
      nextAction: "Book discovery call"
    },
    {
      id: "deal-mhb-may",
      teamId: "team-uk",
      repName: "Manoj",
      year: 2026,
      month: 5,
      companyName: "MHB",
      product: "Civil NX",
      category: "Non-MODS",
      dealType: "Upsell",
      minAmount: 4000,
      maxAmount: 4000,
      probability: 100,
      temperature: "High",
      status: "Closed",
      closedAmount: 4000,
      expectedCloseDate: "",
      comments: "Closed in May",
      nextAction: ""
    },
    {
      id: "deal-wentworth-may",
      teamId: "team-uk",
      repName: "Manoj",
      year: 2026,
      month: 5,
      companyName: "Wentworth",
      product: "Civil NX",
      category: "Non-MODS",
      dealType: "Upsell",
      minAmount: 3000,
      maxAmount: 3000,
      probability: 100,
      temperature: "High",
      status: "Closed",
      closedAmount: 3000,
      expectedCloseDate: "",
      comments: "Closed in May",
      nextAction: ""
    }
  ];

  return {
    teams,
    goals,
    deals,
    preparedBy: "Vito Lee",
    lastUpdated: new Date().toISOString()
  };
}

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toCsv(rows) {
  return [CSV_FIELDS.join(","), ...rows.map((row) => CSV_FIELDS.map((field) => escapeCsv(row[field])).join(","))].join("\n");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((row) =>
    headers.reduce((record, header, index) => {
      record[header] = row[index] ?? "";
      return record;
    }, {})
  );
}

function dataToCsv(data) {
  const rows = [
    {
      entity: "meta",
      preparedBy: data.preparedBy,
      lastUpdated: data.lastUpdated
    },
    ...data.teams.map((team) => ({
      entity: "team",
      ...team,
      reps: team.reps.join("; ")
    })),
    ...data.deals.map((deal) => ({
      entity: "deal",
      ...deal
    })),
    ...data.goals.map((goal) => ({
      entity: "goal",
      ...goal
    }))
  ];
  return toCsv(rows);
}

function csvToData(text) {
  const records = csvToObjects(text);
  const meta = records.find((record) => record.entity === "meta") || {};
  const teams = records
    .filter((record) => record.entity === "team")
    .map((record) => ({
      id: record.id || createId("team"),
      teamName: record.teamName,
      teamLead: record.teamLead,
      region: record.region,
      currency: record.currency || "GBP",
      krwRate: num(record.krwRate),
      reps: String(record.reps || "")
        .split(";")
        .map((rep) => rep.trim())
        .filter(Boolean)
    }));
  const deals = records
    .filter((record) => record.entity === "deal")
    .map((record) =>
      normalizeDeal({
        id: record.id || createId("deal"),
        teamId: record.teamId,
        repName: record.repName,
        year: record.year,
        month: record.month,
        companyName: record.companyName,
        product: record.product,
        category: record.category || "MODS",
        dealType: record.dealType || "Renewal",
        minAmount: record.minAmount,
        maxAmount: record.maxAmount,
        probability: record.probability,
        temperature: record.temperature || "Medium",
        status: record.status || "Open",
        closedAmount: record.closedAmount,
        expectedCloseDate: record.expectedCloseDate,
        hubspotDealUrl: record.hubspotDealUrl,
        comments: record.comments,
        repComment: record.repComment,
        managerComment: record.managerComment,
        nextAction: record.nextAction
      })
    );
  const goals = records
    .filter((record) => record.entity === "goal")
    .map((record) =>
      normalizeGoal({
        id: record.id || createId("goal"),
        teamId: record.teamId,
        repName: record.repName,
        year: record.year,
        month: record.month,
        category: record.category || "MODS",
        goalType: record.goalType || "Responsibility Goal",
        targetAmount: record.targetAmount
      })
    );

  if (!teams.length) throw new Error("CSV import must include at least one team row.");
  return {
    teams,
    deals,
    goals,
    preparedBy: meta.preparedBy || "Vito Lee",
    lastUpdated: new Date().toISOString()
  };
}

function emptyData() {
  return {
    teams: [],
    deals: [],
    goals: [],
    roles: [],
    settings: {},
    preparedBy: "Vito Lee",
    lastUpdated: ""
  };
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthName(month) {
  return MONTHS[num(month) - 1] || "";
}

function periodMonths(periodType, month, quarter, halfYear) {
  if (periodType === "Quarterly") return QUARTERS.find((item) => num(item.value) === num(quarter))?.months || [1, 2, 3];
  if (periodType === "Half-Yearly") return HALF_YEARS.find((item) => num(item.value) === num(halfYear))?.months || [1, 2, 3, 4, 5, 6];
  return [num(month) || 1];
}

function periodLabel({ periodType = "Monthly", year, month, quarter, halfYear }) {
  if (periodType === "Quarterly") {
    const item = QUARTERS.find((entry) => num(entry.value) === num(quarter)) || QUARTERS[0];
    return `${item.label} ${year}`;
  }
  if (periodType === "Half-Yearly") {
    const item = HALF_YEARS.find((entry) => num(entry.value) === num(halfYear)) || HALF_YEARS[0];
    return `${item.label} ${year}`;
  }
  return `${monthName(month)} ${year}`;
}

function periodScope({ year, periodType = "Monthly", month, quarter, halfYear, ...extra }) {
  return {
    year,
    months: periodMonths(periodType, month, quarter, halfYear),
    ...extra
  };
}

function formatMoney(value, currency = "KRW") {
  const amount = num(value);
  if (currency === "KRW") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0
    }).format(amount);
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatCompactMoney(value, currency = "KRW") {
  const amount = num(value);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1
  })
    .format(amount)
    .replace(/([0-9])([a-z])$/i, (_, digit, suffix) => `${digit}${suffix.toUpperCase()}`);
}

function currencySymbol(currency = "KRW") {
  return { KRW: "₩", GBP: "£", EUR: "€", USD: "$" }[currency] || `${currency} `;
}

function formatChartMoney(value, currency = "KRW") {
  const amount = num(value);
  if (currency === "KRW") {
    return `KRW ${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(amount / 1000000)}M`;
  }
  return formatMoney(amount, currency);
}

function chartAxisTick(value, currency = "KRW") {
  const amount = num(value);
  if (currency === "KRW") return `${Math.round(amount / 1000000)}M`;
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(amount);
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeRoleValue(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "team lead") return "Team Lead";
  if (normalized === "manager") return "Manager";
  if (normalized === "team member") return "Team Member";
  if (normalized === "no access") return "No Access";
  return role || "No Access";
}

function normalizeGoogleSub(value) {
  return String(value || "").trim();
}

function roleMatchesIdentity(role, email = "", googleSub = "") {
  const normalizedEmail = normalizeEmail(email);
  const normalizedSub = normalizeGoogleSub(googleSub);
  return (
    (normalizedEmail && normalizeEmail(role.email) === normalizedEmail) ||
    (normalizedSub && normalizeGoogleSub(role.googleSub) === normalizedSub)
  );
}

function accessForUser(roles = [], email = "", googleSub = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!roles.length) {
    return { role: "Manager", email: normalizedEmail, googleSub: normalizeGoogleSub(googleSub), unrestrictedSetup: true };
  }
  const role = roles.find((item) => roleMatchesIdentity(item, email, googleSub));
  return role
    ? { ...role, role: normalizeRoleValue(role.role), email: normalizedEmail || normalizeEmail(role.email), googleSub: normalizeGoogleSub(googleSub) || normalizeGoogleSub(role.googleSub) }
    : { role: "No Access", email: normalizedEmail, googleSub: normalizeGoogleSub(googleSub) };
}

function isManagerAccess(access) {
  return PRIVILEGED_ROLES.includes(access?.role);
}

function canEditManagerComment(access) {
  return normalizeRoleValue(access?.role) === "Team Lead";
}

function hasTeamLeadRole(roles = [], email = "", googleSub = "") {
  return roles.some((role) => roleMatchesIdentity(role, email, googleSub) && normalizeRoleValue(role.role) === "Team Lead");
}

function canUseTeam(access, teamId) {
  if (isManagerAccess(access)) return true;
  if (access?.role === "Team Member") return access.teamId === teamId;
  return false;
}

function canUseRep(access, repName) {
  if (isManagerAccess(access)) return true;
  if (access?.role === "Team Member") return !access.repName || access.repName === repName;
  return false;
}

function canUseRecord(access, record) {
  return canUseTeam(access, record.teamId) && canUseRep(access, record.repName);
}

function scopedDataForAccess(data, access) {
  if (isManagerAccess(access)) return data;
  const teams = data.teams
    .filter((team) => canUseTeam(access, team.id))
    .map((team) => ({
      ...team,
      reps: access.role === "Team Member" && access.repName ? team.reps.filter((rep) => rep === access.repName) : team.reps
    }));
  return {
    ...data,
    teams,
    deals: data.deals.filter((deal) => canUseRecord(access, deal)),
    goals: data.goals.filter((goal) => canUseRecord(access, goal)),
    roles: []
  };
}

function isPerformanceTeam(team) {
  const name = String(team.teamName || "").trim().toLowerCase();
  return name === "uk" || name === "uk team" || name === "ee1" || name === "ee2" || name === "france" || name.includes("france");
}

function makePieLabel(currency = "KRW") {
  return ({ cx, cy, midAngle, outerRadius, value, name, fill }) => {
    if (!value) return null;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const anchor = x > cx ? "start" : "end";

    return (
      <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fill={fill} className="text-xs font-bold">
        <tspan x={x} dy="-0.45em">
          {name}
        </tspan>
        <tspan x={x} dy="1.25em">
          {formatChartMoney(value, currency)}
        </tspan>
      </text>
    );
  };
}

function formatPercent(value) {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  return `${Math.round(value * 100)}%`;
}

function closedAchievementHelper(metrics, currency = "KRW") {
  const remaining = metrics.target - metrics.closed;
  if (metrics.target <= 0) return { text: "No goal set", tone: "muted" };
  if (remaining > 0) return { text: `Remaining: ${formatMoney(remaining, currency)}`, tone: "red" };
  return { text: `Above goal: ${formatMoney(Math.abs(remaining), currency)}`, tone: "green" };
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function normalizeDeal(deal) {
  const next = {
    ...deal,
    year: num(deal.year),
    month: num(deal.month),
    minAmount: num(deal.minAmount),
    maxAmount: num(deal.maxAmount),
    probability: num(deal.probability),
    hubspotDealUrl: String(deal.hubspotDealUrl || "").trim(),
    repComment: deal.repComment ?? deal.comments ?? "",
    managerComment: deal.managerComment ?? ""
  };
  next.comments = deal.comments ?? next.repComment;
  next.closedAmount =
    next.status === "Closed" && deal.closedAmount === "" ? next.maxAmount : num(deal.closedAmount);
  return next;
}

function normalizeGoal(goal) {
  return {
    ...goal,
    year: num(goal.year),
    month: num(goal.month),
    targetAmount: num(goal.targetAmount)
  };
}

function getTeam(teams, teamId) {
  return teams.find((team) => team.id === teamId);
}

function toKrw(amount, team) {
  return num(amount) * num(team?.krwRate || 0);
}

// Central currency rates. The single source of truth is the Settings sheet
// (keys rateGBP/rateEUR/rateUSD). KRW is always 1. When a currency has no
// stored central rate yet, we fall back to the rate already on a team using
// that currency (seamless migration) and finally to a sensible default.
function rateForCurrency(currency, settings = {}, teams = []) {
  const code = String(currency || "KRW").toUpperCase();
  if (code === "KRW") return 1;
  const stored = num(settings?.[`rate${code}`]);
  if (stored > 0) return stored;
  const fromTeam = teams.find(
    (team) => String(team.currency || "").toUpperCase() === code && num(team.krwRate) > 0
  );
  if (fromTeam) return num(fromTeam.krwRate);
  return DEFAULT_KRW_RATES[code] || 0;
}

function ratesFromSettings(settings = {}, teams = []) {
  return {
    KRW: 1,
    GBP: rateForCurrency("GBP", settings, teams),
    EUR: rateForCurrency("EUR", settings, teams),
    USD: rateForCurrency("USD", settings, teams)
  };
}

// Every team's effective krwRate is derived from the central rates so a single
// rate change updates all teams, deals, goals, and charts at once.
function applyRatesToTeams(teams = [], settings = {}) {
  return (teams || []).map((team) => ({
    ...team,
    krwRate: rateForCurrency(team.currency, settings, teams)
  }));
}

// Scale every monetary field of a metrics object by a factor (e.g. to convert
// team-local metrics into a chosen display currency). Ratios are left intact.
function scaleMetrics(metrics, factor = 1) {
  const f = (value) => num(value) * factor;
  return {
    ...metrics,
    target: f(metrics.target),
    closed: f(metrics.closed),
    min: f(metrics.min),
    max: f(metrics.max),
    achievementMin: f(metrics.achievementMin),
    achievementMax: f(metrics.achievementMax),
    gapMin: f(metrics.gapMin),
    gapMax: f(metrics.gapMax)
  };
}

// Convert KRW-base aggregate metrics into any display currency. Multi-team
// totals are summed in KRW, then divided by the display currency's KRW rate.
function krwToCurrency(metrics, currency, rates = {}) {
  if (String(currency || "").toUpperCase() === "KRW") return metrics;
  const rate = rateOf(currency, rates);
  return scaleMetrics(metrics, rate > 0 ? 1 / rate : 1);
}

function dealClosedAmount(deal) {
  return num(deal.closedAmount) || num(deal.maxAmount);
}

function amountForView(amount, team, useKrw) {
  return useKrw ? toKrw(amount, team) : num(amount);
}

// KRW per 1 unit of a currency, using the central rates map. KRW is always 1.
function rateOf(currency, rates = {}) {
  if (String(currency || "").toUpperCase() === "KRW") return 1;
  return num(rates[currency]);
}

// Convert a value from one currency to another via their KRW rates. Falls back
// to the raw value if either rate is missing so amounts are never silently zeroed.
function convertBetween(value, fromCurrency, toCurrency, rates = {}) {
  if (value === "" || value === null || value === undefined) return value;
  if (fromCurrency === toCurrency) return num(value);
  const from = rateOf(fromCurrency, rates);
  const to = rateOf(toCurrency, rates);
  if (from <= 0 || to <= 0) return num(value);
  return (num(value) * from) / to;
}

function matchesScope(item, scope) {
  if (scope.year && num(item.year) !== num(scope.year)) return false;
  if (scope.months?.length && !scope.months.map(num).includes(num(item.month))) return false;
  if (scope.month && num(item.month) !== num(scope.month)) return false;
  if (Array.isArray(scope.teamIds) && !scope.teamIds.includes(item.teamId)) return false;
  if (scope.teamId && item.teamId !== scope.teamId) return false;
  if (scope.repName && scope.repName !== "All reps" && item.repName !== scope.repName) return false;
  if (scope.category && item.category !== scope.category) return false;
  return true;
}

function calculateMetrics({ teams, deals, goals, scope, goalType, useKrw = true }) {
  const target = goals
    .filter((goal) => goal.goalType === goalType && matchesScope(goal, scope))
    .reduce((sum, goal) => {
      const team = getTeam(teams, goal.teamId);
      return sum + amountForView(goal.targetAmount, team, useKrw);
    }, 0);

  const closed = deals
    .filter((deal) => deal.status === "Closed" && matchesScope(deal, scope))
    .reduce((sum, deal) => {
      const team = getTeam(teams, deal.teamId);
      return sum + amountForView(dealClosedAmount(deal), team, useKrw);
    }, 0);

  const min = deals
    .filter((deal) => deal.status === "Open" && matchesScope(deal, scope))
    .reduce((sum, deal) => {
      const team = getTeam(teams, deal.teamId);
      return sum + amountForView(deal.minAmount, team, useKrw);
    }, 0);

  const max = deals
    .filter((deal) => deal.status === "Open" && matchesScope(deal, scope))
    .reduce((sum, deal) => {
      const team = getTeam(teams, deal.teamId);
      return sum + amountForView(deal.maxAmount, team, useKrw);
    }, 0);

  const achievementMin = closed + min;
  const achievementMax = closed + max;

  return {
    target,
    closed,
    min,
    max,
    achievementMin,
    achievementMax,
    gapMin: achievementMin - target,
    gapMax: achievementMax - target,
    minCoverage: target > 0 ? achievementMin / target : 0,
    maxCoverage: target > 0 ? achievementMax / target : 0
  };
}

function riskFor(metrics) {
  if (metrics.achievementMin >= metrics.target && metrics.target > 0) return "Safe";
  if (metrics.achievementMax >= metrics.target && metrics.target > 0) return "Possible";
  return "Risk";
}

function coverageClass(coverage, target) {
  if (!target) return "bg-slate-100 text-slate-600";
  if (coverage >= 1) return "bg-green-100 text-green-700";
  if (coverage >= 0.7) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    grey: "bg-slate-100 text-slate-700",
    purple: "bg-purple-100 text-purple-700",
    slate: "bg-slate-100 text-slate-700"
  };
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function temperatureTone(value) {
  return value === "High" ? "green" : value === "Medium" ? "amber" : "red";
}

function statusTone(value) {
  if (value === "Closed") return "green";
  if (value === "Open") return "blue";
  if (value === "Long-Term") return "purple";
  return "grey";
}

function TopNav({ activeTab, setActiveTab, tabs = TABS }) {
  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto border-t border-midas-line pt-3">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`shrink-0 rounded-md px-3 py-2 text-sm font-bold transition ${
            activeTab === tab ? "bg-midas-navy text-white" : "bg-slate-100 text-midas-ink hover:bg-slate-200"
          }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}

function Header({
  activeTab,
  setActiveTab,
  selectedYear,
  setSelectedYear,
  selectedPeriodType,
  setSelectedPeriodType,
  selectedMonth,
  setSelectedMonth,
  selectedQuarter,
  setSelectedQuarter,
  selectedHalfYear,
  setSelectedHalfYear,
  preparedBy,
  setPreparedBy,
  lastUpdated,
  onExportCsv,
  onImportCsv,
  onExportJson,
  onImportJson,
  onBackup,
  onRefresh,
  refreshing = false,
  connectionStatus = "checking",
  connectionMessage = "Checking Google Sheets...",
  onReconnect,
  onFullSignIn,
  reconnecting = false,
  isManager = true,
  access,
  availableTabs = TABS,
  rates = DEFAULT_KRW_RATES,
  onSaveRates
}) {
  const teamsCsvRef = useRef(null);
  const dealsCsvRef = useRef(null);
  const goalsCsvRef = useRef(null);
  const jsonRef = useRef(null);
  const connectionBadge =
    connectionStatus === "connected"
      ? { label: "Sheets connected", className: "bg-green-50 text-green-700" }
      : connectionStatus === "checking"
        ? { label: "Checking Sheets", className: "bg-blue-50 text-blue-700" }
        : connectionStatus === "denied"
          ? { label: "Access denied", className: "bg-red-50 text-red-700" }
          : { label: "Reconnect required", className: "bg-red-50 text-red-700" };

  return (
    <header className="border-b border-midas-line bg-slate-50 px-4 py-4 lg:px-6">
      <div className="grid gap-3 lg:grid-cols-[minmax(300px,0.95fr)_minmax(250px,0.62fr)_minmax(360px,1.08fr)] xl:gap-4">
        <div className="panel flex min-h-44 flex-col justify-between overflow-hidden border-l-4 border-l-midas-navy p-4 xl:p-5">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-midas-blue">
              MIDAS Internal
            </div>
            <h1 className="text-2xl font-extrabold text-midas-ink 2xl:text-3xl">MIDAS IT Europe Sales Forecast</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Last updated {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Not saved yet"}
            </p>
          </div>
          {isManager ? (
            <button className="btn-danger mt-5 w-full sm:w-72" onClick={onBackup}>
              Download JSON Backup
            </button>
          ) : (
            <div className="mt-5 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              Signed in as {access?.role || "Team Member"}
            </div>
          )}
        </div>

        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Forecast Scope</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${connectionBadge.className}`}>{connectionBadge.label}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <div>
              <label className="label">Year</label>
              <select className="field" value={selectedYear} onChange={(e) => setSelectedYear(num(e.target.value))}>
                {YEARS.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Period</label>
              <select className="field" value={selectedPeriodType} onChange={(e) => setSelectedPeriodType(e.target.value)}>
                {PERIOD_TYPES.map((period) => (
                  <option key={period}>{period}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">{selectedPeriodType}</label>
              {selectedPeriodType === "Monthly" ? (
                <select className="field" value={selectedMonth} onChange={(e) => setSelectedMonth(num(e.target.value))}>
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              ) : null}
              {selectedPeriodType === "Quarterly" ? (
                <select className="field" value={selectedQuarter} onChange={(e) => setSelectedQuarter(num(e.target.value))}>
                  {QUARTERS.map((quarter) => (
                    <option key={quarter.value} value={quarter.value}>
                      {quarter.label}
                    </option>
                  ))}
                </select>
              ) : null}
              {selectedPeriodType === "Half-Yearly" ? (
                <select className="field" value={selectedHalfYear} onChange={(e) => setSelectedHalfYear(num(e.target.value))}>
                  {HALF_YEARS.map((half) => (
                    <option key={half.value} value={half.value}>
                      {half.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Prepared for</label>
              <input className="field" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} />
            </div>
          </div>
          <div className={`mt-3 rounded-md px-3 py-2 text-xs font-semibold ${connectionStatus === "connected" ? "bg-green-50 text-green-700" : connectionStatus === "checking" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
            {connectionMessage}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button className={connectionStatus === "connected" ? "btn-secondary" : "btn-primary"} onClick={onReconnect} disabled={reconnecting}>
              {reconnecting ? "Connecting..." : connectionStatus === "connected" ? "Renew connection" : "Reconnect Google Sheets"}
            </button>
            <button className="btn-secondary" onClick={onRefresh} disabled={refreshing || reconnecting}>
              {refreshing ? "Checking..." : "Check & refresh"}
            </button>
          </div>
          {connectionStatus === "reconnect" ? (
            <button className="mt-2 w-full text-xs font-bold text-midas-blue underline underline-offset-2" onClick={onFullSignIn}>
              Use full-page Google sign-in
            </button>
          ) : null}
        </div>

        {isManager ? (
        <div className="panel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Data Exchange</h2>
            <span className="text-xs font-semibold text-slate-500">Excel + Backup</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              ["Teams CSV", () => onExportCsv("teams"), () => teamsCsvRef.current?.click()],
              ["Deals CSV", () => onExportCsv("deals"), () => dealsCsvRef.current?.click()],
              ["Monthly Goals CSV", () => onExportCsv("goals"), () => goalsCsvRef.current?.click()],
              ["Full Backup JSON", onExportJson, () => jsonRef.current?.click()]
            ].map(([label, exportAction, importAction]) => (
              <div key={label} className="rounded-md border border-midas-line bg-slate-50 p-2">
                <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-secondary py-1.5" onClick={exportAction}>
                    Export
                  </button>
                  <button className="btn-secondary py-1.5" onClick={importAction}>
                    Import
                  </button>
                </div>
              </div>
            ))}
            <input ref={teamsCsvRef} className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => onImportCsv("teams", event)} />
            <input ref={dealsCsvRef} className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => onImportCsv("deals", event)} />
            <input ref={goalsCsvRef} className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => onImportCsv("goals", event)} />
            <input ref={jsonRef} className="hidden" type="file" accept="application/json,.json" onChange={onImportJson} />
          </div>
        </div>
        ) : null}
      </div>
      <CurrencyRateBar rates={rates} isManager={isManager} onSaveRates={onSaveRates} />
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={availableTabs} />
    </header>
  );
}

function CurrencyRateBar({ rates = DEFAULT_KRW_RATES, isManager = false, onSaveRates }) {
  const [draft, setDraft] = useState(rates);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(rates);
  }, [rates.GBP, rates.EUR, rates.USD]);

  const dirty = RATE_CURRENCIES.some((code) => num(draft[code]) !== num(rates[code]));

  async function save() {
    if (!onSaveRates) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSaveRates({ GBP: num(draft.GBP), EUR: num(draft.EUR), USD: num(draft.USD) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      alert(`Could not save currency rates: ${error.message || "please try again."}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-midas-line bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex flex-col">
          <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Exchange Rates</span>
          <span className="text-xs font-semibold text-slate-400">KRW per 1 unit</span>
        </div>
        <span className="rounded bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-600">₩ KRW = 1</span>
        {RATE_CURRENCIES.map((code) => (
          <label key={code} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="w-14">
              {currencySymbol(code)} {code}
            </span>
            {isManager ? (
              <input
                type="number"
                min="0"
                step="any"
                className="field w-28 py-1.5"
                value={draft[code] ?? ""}
                onChange={(event) => setDraft((current) => ({ ...current, [code]: event.target.value }))}
              />
            ) : (
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-600">{num(rates[code]).toLocaleString()}</span>
            )}
          </label>
        ))}
        {isManager ? (
          <button className="btn-primary py-1.5" onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving..." : saved ? "Saved ✓" : "Update rates"}
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-400">
        {isManager
          ? "Updating a rate here instantly recalculates every team, deal, goal, and chart that uses that currency."
          : "Exchange rates are managed centrally. Contact a manager to change them."}
      </p>
    </div>
  );
}

function KpiCard({ label, value, helper, helperTone = "muted", tone = "navy" }) {
  const tones = {
    navy: "border-l-midas-navy",
    green: "border-l-midas-green",
    amber: "border-l-midas-amber",
    red: "border-l-midas-red",
    blue: "border-l-midas-blue"
  };
  const helperTones = {
    muted: "text-slate-500",
    green: "text-green-700",
    red: "text-red-700",
    amber: "text-amber-700"
  };
  return (
    <div className={`panel border-l-4 ${tones[tone]} p-4`}>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-midas-ink">{value}</div>
      {helper ? <div className={`mt-1 text-sm font-bold ${helperTones[helperTone] || helperTones.muted}`}>{helper}</div> : null}
    </div>
  );
}

function DataTable({ columns, rows, empty = "No records found." }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="table-head">
            {columns.map((column) => (
              <th key={column.header} className={`px-3 py-3 ${column.className || ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id} className="bg-white hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.header} className={`table-cell ${column.className || ""}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="table-cell text-slate-500" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4">
      <div className="panel mt-6 w-full max-w-5xl">
        <div className="flex items-center justify-between border-b border-midas-line px-5 py-4">
          <h2 className="section-title">{title}</h2>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function PasswordGate({ onLogin, externalError = "" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "this site";

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setHint(`Complete sign-in in the Google window. If you do not see it, allow popups for ${currentOrigin}.`);
    try {
      await api.login();
      sessionStorage.setItem("midas-google-session", "true");
      await onLogin();
    } catch (loginError) {
      setError(loginError.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="panel w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-midas-ink">MIDAS Sales Forecast</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with a Google account that has access to the forecast spreadsheet.</p>
        <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
          Please request access from manoj@midasit.com by providing your Gmail email address.
        </div>
        {externalError ? <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{externalError}</div> : null}
        {error ? <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div> : null}
        {hint ? <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{hint}</div> : null}
        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Waiting for Google..." : "Sign in with Google"}
        </button>
        <button
          type="button"
          className="btn-secondary mt-2 w-full"
          disabled={loading}
          onClick={() => api.redirectLogin()}
        >
          Use full-page Google sign-in
        </button>
        {loading ? (
          <button
            type="button"
            className="btn-secondary mt-2 w-full"
            onClick={() => {
              setLoading(false);
              setHint("");
            }}
          >
            Reset sign-in
          </button>
        ) : null}
      </form>
    </div>
  );
}

function ImportPreviewModal({ preview, type, onCancel, onConfirm, importing }) {
  const rows = [...(preview?.errorRows || []), ...(preview?.duplicateRows || []), ...(preview?.validRows || [])].slice(0, 80);
  const hasErrors = Boolean(preview?.errorRows?.length);
  const updateCount = preview?.summary?.updated || 0;

  return (
    <Modal title={`Import ${type} CSV Preview`} onClose={onCancel}>
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Rows added" value={preview.summary.added} tone="green" />
        <KpiCard label="Rows updated" value={preview.summary.updated} tone="blue" />
        <KpiCard label="Rows skipped" value={preview.summary.skipped} tone={hasErrors ? "red" : "navy"} />
        <KpiCard label="Duplicates" value={preview.duplicateRows.length} tone="amber" />
      </div>
      {hasErrors ? (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Fix rows with errors before importing. Bad data is not silently saved.
        </div>
      ) : null}
      {updateCount ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Warning: this CSV will update {updateCount} existing {type} record{updateCount === 1 ? "" : "s"}. If any existing row was edited incorrectly or fields were cleared in Excel, those changes will overwrite the current app data. Cancel now if you only wanted to add new rows.
        </div>
      ) : null}
      <div className="mt-5 max-h-96 overflow-auto">
        <DataTable
          rows={rows.map((row, index) => ({ ...row, id: `${row.rowNumber}-${index}` }))}
          columns={[
            { header: "CSV Row", render: (row) => row.rowNumber },
            { header: "Action", render: (row) => <Badge tone={row.errors.length ? "red" : row.action === "update" ? "amber" : "green"}>{row.errors.length ? "skip" : row.action}</Badge> },
            { header: "Duplicate", render: (row) => (row.duplicate ? <Badge tone="amber">Duplicate</Badge> : "-") },
            { header: "Errors", render: (row) => row.errors.join(" ") || "-" },
            { header: "Warnings", render: (row) => row.warnings.join(" ") || "-" }
          ]}
        />
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-midas-line pt-4">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" onClick={onConfirm} disabled={hasErrors || importing}>
          {importing ? "Importing..." : updateCount ? "Confirm Add / Update Import" : "Confirm Import"}
        </button>
      </div>
    </Modal>
  );
}

function FormActions({ onCancel, submitLabel, disabled = false }) {
  return (
    <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-midas-line pt-4">
      <button type="button" className="btn-secondary" onClick={onCancel} disabled={disabled}>
        Cancel
      </button>
      <button type="submit" className="btn-primary" disabled={disabled}>
        {submitLabel}
      </button>
    </div>
  );
}

function TeamForm({ initialTeam, onSave, onCancel }) {
  const [form, setForm] = useState(
    initialTeam || {
      teamName: "",
      teamLead: "",
      region: "",
      currency: "GBP",
      reps: []
    }
  );

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave({
      ...form,
      id: form.id || createId("team"),
      reps: String(form.repsText ?? form.reps.join(", "))
        .split(",")
        .map((rep) => rep.trim())
        .filter(Boolean)
    });
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Team name</label>
          <input required className="field" value={form.teamName} onChange={(e) => update("teamName", e.target.value)} />
        </div>
        <div>
          <label className="label">Team lead</label>
          <input required className="field" value={form.teamLead} onChange={(e) => update("teamLead", e.target.value)} />
        </div>
        <div>
          <label className="label">Region</label>
          <input required className="field" value={form.region} onChange={(e) => update("region", e.target.value)} />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="field" value={form.currency} onChange={(e) => update("currency", e.target.value)}>
            {CURRENCIES.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
          <p className="mt-1 text-xs font-medium text-slate-400">
            KRW conversion is set centrally in the Exchange Rates bar at the top of the app.
          </p>
        </div>
        <div>
          <label className="label">Reps, comma separated</label>
          <input
            required
            className="field"
            value={form.repsText ?? form.reps.join(", ")}
            onChange={(e) => update("repsText", e.target.value)}
          />
        </div>
      </div>
      <FormActions onCancel={onCancel} submitLabel={initialTeam ? "Save team" : "Add team"} />
    </form>
  );
}

function DealForm({ teams, initialDeal, selectedYear, selectedMonth, onSave, onCancel, rates = {}, saving = false, error = "" }) {
  const firstTeam = teams[0];
  const [form, setForm] = useState(() => {
    const blankDeal = {
      teamId: firstTeam?.id || "",
      repName: firstTeam?.reps?.[0] || "",
      year: selectedYear,
      month: selectedMonth,
      companyName: "",
      product: "",
      category: "MODS",
      dealType: "Renewal",
      minAmount: 0,
      maxAmount: 0,
      probability: 50,
      temperature: "Medium",
      status: "Open",
      closedAmount: "",
      expectedCloseDate: "",
      hubspotDealUrl: "",
      comments: "",
      repComment: "",
      managerComment: "",
      nextAction: ""
    };
    if (initialDeal) return initialDeal;
    try {
      const draft = JSON.parse(sessionStorage.getItem(DEAL_DRAFT_KEY) || "null");
      return draft && typeof draft === "object" ? { ...blankDeal, ...draft } : blankDeal;
    } catch {
      return blankDeal;
    }
  });
  const initialTeam = getTeam(teams, initialDeal?.teamId || firstTeam?.id);
  // Entry currency for the amount fields — any of KRW/GBP/EUR/USD, not tied to
  // the team's home currency. Defaults to the team currency (stored values are
  // already in that currency, so editing shows them unchanged).
  const [amountCurrency, setAmountCurrency] = useState(initialTeam?.currency || "GBP");
  const selectedTeam = getTeam(teams, form.teamId);
  const teamCurrency = selectedTeam?.currency || "GBP";

  useEffect(() => {
    if (!initialDeal) sessionStorage.setItem(DEAL_DRAFT_KEY, JSON.stringify(form));
  }, [form, initialDeal]);

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "teamId") {
        next.repName = getTeam(teams, value)?.reps?.[0] || "";
      }
      return next;
    });
  }

  // Switch the entry currency, converting the values already typed so the
  // displayed numbers keep their real-world value.
  function changeAmountCurrency(next) {
    if (next === amountCurrency) return;
    const convert = (value) => {
      const result = convertBetween(value, amountCurrency, next, rates);
      return result === "" ? "" : Math.round(num(result) * 100) / 100;
    };
    setForm((current) => ({
      ...current,
      minAmount: convert(current.minAmount),
      maxAmount: convert(current.maxAmount),
      closedAmount: current.closedAmount === "" ? "" : convert(current.closedAmount)
    }));
    setAmountCurrency(next);
  }

  // Live KRW equivalent (the company currency) shown under each amount field.
  function amountEquivalent(value) {
    if (value === "" || value === null || value === undefined) return null;
    if (amountCurrency === "KRW") return null;
    const krw = convertBetween(value, amountCurrency, "KRW", rates);
    if (krw === "" || num(krw) <= 0) return null;
    return `≈ ${formatMoney(krw, "KRW")}`;
  }

  function submit(event) {
    event.preventDefault();
    if (saving) return;
    const dealId = form.id || createId("deal");
    if (!form.id) setForm((current) => ({ ...current, id: dealId }));
    if (!initialDeal) sessionStorage.setItem(DEAL_DRAFT_KEY, JSON.stringify({ ...form, id: dealId }));
    // Stored amounts are always in the team's home currency.
    const toLocal = (value) =>
      value === "" ? "" : convertBetween(value, amountCurrency, teamCurrency, rates);
    const converted = {
      ...form,
      minAmount: toLocal(form.minAmount),
      maxAmount: toLocal(form.maxAmount),
      closedAmount: toLocal(form.closedAmount)
    };
    onSave(normalizeDeal({ ...converted, id: dealId }));
  }

  function cancel() {
    if (!initialDeal) sessionStorage.removeItem(DEAL_DRAFT_KEY);
    onCancel();
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Team</label>
          <select required className="field" value={form.teamId} onChange={(e) => update("teamId", e.target.value)}>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.teamName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Rep</label>
          <select required className="field" value={form.repName} onChange={(e) => update("repName", e.target.value)}>
            {(selectedTeam?.reps || []).map((rep) => (
              <option key={rep}>{rep}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <select className="field" value={form.year} onChange={(e) => update("year", e.target.value)}>
            {YEARS.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Month</label>
          <select className="field" value={form.month} onChange={(e) => update("month", e.target.value)}>
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Company name</label>
          <input required className="field" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
        </div>
        <div>
          <label className="label">Product</label>
          <input required className="field" value={form.product} onChange={(e) => update("product", e.target.value)} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="field" value={form.category} onChange={(e) => update("category", e.target.value)}>
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Deal type</label>
          <select className="field" value={form.dealType} onChange={(e) => update("dealType", e.target.value)}>
            {DEAL_TYPES.map((dealType) => (
              <option key={dealType}>{dealType}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Amount entered in</label>
          <select className="field" value={amountCurrency} onChange={(e) => changeAmountCurrency(e.target.value)}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencySymbol(code)} {code}
                {code === teamCurrency ? " (team)" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs font-medium text-slate-400">Stored in {teamCurrency} (team currency).</p>
        </div>
        <div>
          <label className="label">Min amount ({amountCurrency})</label>
          <input type="number" min="0" step="any" className="field" value={form.minAmount} onChange={(e) => update("minAmount", e.target.value)} />
          {amountEquivalent(form.minAmount) ? (
            <p className="mt-1 text-xs font-medium text-slate-400">{amountEquivalent(form.minAmount)}</p>
          ) : null}
        </div>
        <div>
          <label className="label">Max amount ({amountCurrency})</label>
          <input type="number" min="0" step="any" className="field" value={form.maxAmount} onChange={(e) => update("maxAmount", e.target.value)} />
          {amountEquivalent(form.maxAmount) ? (
            <p className="mt-1 text-xs font-medium text-slate-400">{amountEquivalent(form.maxAmount)}</p>
          ) : null}
        </div>
        <div>
          <label className="label">Probability %</label>
          <input
            type="number"
            min="0"
            max="100"
            className="field"
            value={form.probability}
            onChange={(e) => update("probability", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Temperature</label>
          <select className="field" value={form.temperature} onChange={(e) => update("temperature", e.target.value)}>
            {TEMPERATURES.map((temperature) => (
              <option key={temperature}>{temperature}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="field" value={form.status} onChange={(e) => update("status", e.target.value)}>
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Closed amount ({amountCurrency})</label>
          <input
            type="number"
            min="0"
            step="any"
            className="field"
            value={form.closedAmount}
            onChange={(e) => update("closedAmount", e.target.value)}
            placeholder="Uses max amount if closed"
          />
          {amountEquivalent(form.closedAmount) ? (
            <p className="mt-1 text-xs font-medium text-slate-400">{amountEquivalent(form.closedAmount)}</p>
          ) : null}
        </div>
        <div>
          <label className="label">Expected close date</label>
          <input type="date" className="field" value={form.expectedCloseDate} onChange={(e) => update("expectedCloseDate", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">HubSpot deal link</label>
          <input
            type="url"
            className="field"
            value={form.hubspotDealUrl || ""}
            onChange={(e) => update("hubspotDealUrl", e.target.value)}
            placeholder="https://app.hubspot.com/contacts/.../deal/..."
          />
          <p className="mt-1 text-xs font-medium text-slate-400">The company name becomes clickable in Team View.</p>
        </div>
        <div className="md:col-span-3">
          <label className="label">Rep comment</label>
          <textarea
            className="field min-h-20"
            value={form.repComment ?? form.comments ?? ""}
            onChange={(e) => setForm((current) => ({ ...current, repComment: e.target.value, comments: e.target.value }))}
          />
        </div>
        <div className="md:col-span-3">
          <label className="label">Manager comment</label>
          <textarea className="field min-h-20" value={form.managerComment || ""} onChange={(e) => update("managerComment", e.target.value)} />
        </div>
        <div className="md:col-span-3">
          <label className="label">Next action</label>
          <textarea className="field min-h-20" value={form.nextAction} onChange={(e) => update("nextAction", e.target.value)} />
        </div>
      </div>
      {saving ? <div className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Saving and verifying with Google Sheets...</div> : null}
      {error ? <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div> : null}
      <FormActions onCancel={cancel} submitLabel={saving ? "Saving..." : initialDeal ? "Save deal" : "Add deal"} disabled={saving} />
    </form>
  );
}

function BulkDealForm({ teams, selectedYear, selectedMonth, onSave, onCancel, saving = false, rates = {} }) {
  const firstTeam = teams[0];
  const [teamId, setTeamId] = useState(firstTeam?.id || "");
  const [repName, setRepName] = useState(firstTeam?.reps?.[0] || "");
  const [year, setYear] = useState(selectedYear);
  const [month, setMonth] = useState(selectedMonth);
  const [defaultCategory, setDefaultCategory] = useState("MODS");
  const [dealType, setDealType] = useState("Other");
  const [status, setStatus] = useState("Open");
  const [temperature, setTemperature] = useState("Medium");
  const [probability, setProbability] = useState(60);
  const [amountCurrency, setAmountCurrency] = useState(firstTeam?.currency || "GBP");
  const [defaultProduct, setDefaultProduct] = useState("");
  const [rows, setRows] = useState(() =>
    Array.from({ length: 12 }, () => ({ companyName: "", amount: "", maxAmount: "", product: "", category: "", comments: "" }))
  );
  const team = getTeam(teams, teamId);
  const teamCurrency = team?.currency || "GBP";
  const amountCurrencyLabel = amountCurrency;
  const fields = ["companyName", "amount", "maxAmount", "product", "category", "comments"];

  function updateRow(index, field, value) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  }

  function cleanPastedValue(value) {
    return String(value || "").trim();
  }

  function cleanAmount(value) {
    return String(value || "")
      .trim()
      .replace(/[₩£€$,\s]/g, "");
  }

  function pasteRows(startIndex, startField, event) {
    const text = event.clipboardData?.getData("text/plain");
    if (!text) return;
    const pastedRows = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("\t").map(cleanPastedValue));
    if (!pastedRows.length) return;

    event.preventDefault();
    const startFieldIndex = fields.indexOf(startField);
    setRows((current) => {
      const next = current.map((row) => ({ ...row }));
      pastedRows.forEach((pastedRow, rowOffset) => {
        const rowIndex = startIndex + rowOffset;
        if (!next[rowIndex]) next[rowIndex] = { companyName: "", amount: "", maxAmount: "", product: "", category: "", comments: "" };
        pastedRow.forEach((value, columnOffset) => {
          const field = fields[startFieldIndex + columnOffset];
          if (!field) return;
          next[rowIndex][field] = field === "amount" || field === "maxAmount" ? cleanAmount(value) : value;
        });
      });
      return next;
    });
  }

  function addRows() {
    setRows((current) => [...current, ...Array.from({ length: 5 }, () => ({ companyName: "", amount: "", maxAmount: "", product: "", category: "", comments: "" }))]);
  }

  function submit(event) {
    event.preventDefault();
    const deals = rows
      .filter((row) => row.companyName.trim() && row.amount !== "")
      .map((row) => {
        const localAmount = num(convertBetween(row.amount, amountCurrency, teamCurrency, rates));
        const localMax = row.maxAmount === "" ? localAmount : num(convertBetween(row.maxAmount, amountCurrency, teamCurrency, rates));
        const category = CATEGORIES.includes(row.category) ? row.category : defaultCategory;
        return {
          id: createId("deal"),
          teamId,
          repName,
          year: num(year),
          month: num(month),
          companyName: row.companyName.trim(),
          product: row.product.trim() || defaultProduct.trim() || "Bulk deal",
          category,
          dealType,
          minAmount: status === "Closed" ? 0 : localAmount,
          maxAmount: localMax,
          probability: status === "Closed" ? 100 : num(probability),
          temperature,
          status,
          closedAmount: status === "Closed" ? localMax : 0,
          expectedCloseDate: "",
          comments: row.comments,
          repComment: row.comments,
          managerComment: "",
          nextAction: ""
        };
      });
    onSave(deals);
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="label">Team</label>
          <select
            className="field"
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setRepName(getTeam(teams, e.target.value)?.reps?.[0] || "");
            }}
          >
            {teams.map((item) => (
              <option key={item.id} value={item.id}>
                {item.teamName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Rep</label>
          <select className="field" value={repName} onChange={(e) => setRepName(e.target.value)}>
            {(team?.reps || []).map((rep) => (
              <option key={rep}>{rep}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Month</label>
          <select className="field" value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((item, index) => (
              <option key={item} value={index + 1}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Default category</label>
          <select className="field" value={defaultCategory} onChange={(e) => setDefaultCategory(e.target.value)}>
            {CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Deal type</label>
          <select className="field" value={dealType} onChange={(e) => setDealType(e.target.value)}>
            {DEAL_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Open</option>
            <option>Closed</option>
            <option>Long-Term</option>
          </select>
        </div>
        <div>
          <label className="label">Amount currency</label>
          <select className="field" value={amountCurrency} onChange={(e) => setAmountCurrency(e.target.value)}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencySymbol(code)} {code}
                {code === teamCurrency ? " (team)" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs font-medium text-slate-400">Saved in {teamCurrency} (team currency).</p>
        </div>
        <div>
          <label className="label">Default product</label>
          <input className="field" value={defaultProduct} onChange={(e) => setDefaultProduct(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className="label">Probability %</label>
          <input type="number" min="0" max="100" className="field" value={probability} onChange={(e) => setProbability(e.target.value)} />
        </div>
        <div>
          <label className="label">Temperature</label>
          <select className="field" value={temperature} onChange={(e) => setTemperature(e.target.value)}>
            {TEMPERATURES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
        Company and Amount are the main fields. Paste from Excel using columns: Company, Amount, Max Amount, Product, Category, Comments. Amounts are in {amountCurrencyLabel}.
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="table-head">
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">Amount<div className="text-xs font-semibold normal-case text-slate-400">{amountCurrencyLabel}</div></th>
              <th className="px-3 py-3">Max Amount<div className="text-xs font-semibold normal-case text-slate-400">Optional</div></th>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Comments</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {fields.map((field) => (
                  <td key={field} className="table-cell">
                    <input
                      type={field === "amount" || field === "maxAmount" ? "number" : "text"}
                      min={field === "amount" || field === "maxAmount" ? "0" : undefined}
                      step={field === "amount" || field === "maxAmount" ? "any" : undefined}
                      className="field min-w-40"
                      value={row[field]}
                      onChange={(e) => updateRow(index, field, e.target.value)}
                      onPaste={(e) => pasteRows(index, field, e)}
                      placeholder={field === "category" ? defaultCategory : ""}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn-secondary mt-3" onClick={addRows} disabled={saving}>
        Add 5 rows
      </button>
      {saving ? <div className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Saving bulk deals to Google Sheets...</div> : null}
      <FormActions onCancel={onCancel} submitLabel={saving ? "Saving..." : "Save bulk deals"} disabled={saving} />
    </form>
  );
}

function GoalForm({ teams, initialGoal, selectedYear, selectedMonth, goalType, onSave, onCancel, saving = false, rates = {} }) {
  const firstTeam = teams[0];
  const [form, setForm] = useState(
    initialGoal || {
      teamId: firstTeam?.id || "",
      repName: firstTeam?.reps?.[0] || "",
      year: selectedYear,
      month: selectedMonth,
      category: "MODS",
      goalType,
      targetAmount: 0
    }
  );
  const initialTeam = getTeam(teams, initialGoal?.teamId || firstTeam?.id);
  const [amountCurrency, setAmountCurrency] = useState(initialTeam?.currency || "GBP");
  const [targetInput, setTargetInput] = useState(initialGoal?.targetAmount ?? 0);
  const selectedTeam = getTeam(teams, form.teamId);
  const teamCurrency = selectedTeam?.currency || "GBP";
  const localTargetAmount = num(convertBetween(targetInput, amountCurrency, teamCurrency, rates));
  const targetCurrencyLabel = amountCurrency;

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "teamId") next.repName = getTeam(teams, value)?.reps?.[0] || "";
      return next;
    });
  }

  function changeAmountCurrency(nextCurrency) {
    if (nextCurrency === amountCurrency) return;
    const converted = convertBetween(targetInput, amountCurrency, nextCurrency, rates);
    setAmountCurrency(nextCurrency);
    setTargetInput(converted === "" ? "" : Math.round(num(converted) * 100) / 100);
  }

  function submit(event) {
    event.preventDefault();
    onSave(normalizeGoal({ ...form, id: form.id || createId("goal"), targetAmount: localTargetAmount }));
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Team</label>
          <select className="field" value={form.teamId} onChange={(e) => update("teamId", e.target.value)}>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.teamName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Rep</label>
          <select className="field" value={form.repName} onChange={(e) => update("repName", e.target.value)}>
            {(selectedTeam?.reps || []).map((rep) => (
              <option key={rep}>{rep}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <select className="field" value={form.year} onChange={(e) => update("year", e.target.value)}>
            {YEARS.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Month</label>
          <select className="field" value={form.month} onChange={(e) => update("month", e.target.value)}>
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="field" value={form.category} onChange={(e) => update("category", e.target.value)}>
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Goal type</label>
          <select className="field" value={form.goalType} onChange={(e) => update("goalType", e.target.value)}>
            {GOAL_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Amount currency</label>
          <select className="field" value={amountCurrency} onChange={(e) => changeAmountCurrency(e.target.value)}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencySymbol(code)} {code}
                {code === teamCurrency ? " (team)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Target amount ({targetCurrencyLabel})</label>
          <input
            type="number"
            min="0"
            step="any"
            className="field"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
          />
        </div>
        <div className="md:col-span-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
          This goal will be saved as {formatMoney(localTargetAmount, selectedTeam?.currency || "Local")} local target and shown as {formatMoney(toKrw(localTargetAmount, selectedTeam), "KRW")} in KRW reports.
        </div>
      </div>
      {saving ? <div className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Saving goal to Google Sheets...</div> : null}
      <FormActions onCancel={onCancel} submitLabel={saving ? "Saving..." : initialGoal ? "Save goal" : "Add goal"} disabled={saving} />
    </form>
  );
}

function BulkGoalForm({ teams, selectedYear, goalType, onSave, onCancel, saving = false, rates = {} }) {
  const firstTeam = teams[0];
  const [teamId, setTeamId] = useState(firstTeam?.id || "");
  const [repName, setRepName] = useState(firstTeam?.reps?.[0] || "");
  const [year, setYear] = useState(selectedYear);
  const [type, setType] = useState(goalType);
  const [amountCurrency, setAmountCurrency] = useState(firstTeam?.currency || "GBP");
  const [grid, setGrid] = useState({});
  const team = getTeam(teams, teamId);
  const teamCurrency = team?.currency || "GBP";
  const targetCurrencyLabel = amountCurrency;

  function setAmount(month, category, value) {
    setGrid((current) => ({ ...current, [`${month}-${category}`]: value }));
  }

  function cleanPastedAmount(value) {
    return String(value || "")
      .trim()
      .replace(/[₩£€$,\s]/g, "");
  }

  function pasteGrid(startMonth, startCategory, event) {
    const text = event.clipboardData?.getData("text/plain");
    if (!text) return;
    const pastedRows = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("\t").map(cleanPastedAmount));
    if (!pastedRows.length) return;

    event.preventDefault();
    const startCategoryIndex = CATEGORIES.indexOf(startCategory);
    setGrid((current) => {
      const next = { ...current };
      pastedRows.forEach((row, rowOffset) => {
        const month = startMonth + rowOffset;
        if (month > 12) return;
        row.forEach((value, columnOffset) => {
          const category = CATEGORIES[startCategoryIndex + columnOffset];
          if (!category) return;
          next[`${month}-${category}`] = value;
        });
      });
      return next;
    });
  }

  function submit(event) {
    event.preventDefault();
    const rows = [];
    for (let month = 1; month <= 12; month += 1) {
      CATEGORIES.forEach((category) => {
        const rawAmount = grid[`${month}-${category}`];
        if (rawAmount === "" || rawAmount === undefined || rawAmount === null) return;
        rows.push({
          id: createId("goal"),
          teamId,
          repName,
          year: num(year),
          month,
          category,
          goalType: type,
          targetAmount: num(convertBetween(grid[`${month}-${category}`], amountCurrency, teamCurrency, rates))
        });
      });
    }
    onSave(rows);
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-5">
        <div>
          <label className="label">Team</label>
          <select
            className="field"
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setRepName(getTeam(teams, e.target.value)?.reps?.[0] || "");
            }}
          >
            {teams.map((item) => (
              <option key={item.id} value={item.id}>
                {item.teamName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Rep</label>
          <select className="field" value={repName} onChange={(e) => setRepName(e.target.value)}>
            {(team?.reps || []).map((rep) => (
              <option key={rep}>{rep}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Goal type</label>
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
            {GOAL_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Amount currency</label>
          <select className="field" value={amountCurrency} onChange={(e) => setAmountCurrency(e.target.value)}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencySymbol(code)} {code}
                {code === teamCurrency ? " (team)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
        Enter all monthly goal values in {targetCurrencyLabel}. You can paste a block from Excel or Google Sheets into any cell. Values are saved as local targets and converted to KRW using the selected team's KRW rate.
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="table-head">
              <th className="px-3 py-3">Month</th>
              {CATEGORIES.map((category) => (
                <th key={category} className="px-3 py-3">
                  {category}
                  <div className="text-xs font-semibold normal-case text-slate-400">{targetCurrencyLabel}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((month, index) => (
              <tr key={month}>
                <td className="table-cell font-semibold">{month}</td>
                {CATEGORIES.map((category) => (
                  <td key={category} className="table-cell">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="field min-w-32"
                      value={grid[`${index + 1}-${category}`] || ""}
                      onChange={(e) => setAmount(index + 1, category, e.target.value)}
                      onPaste={(e) => pasteGrid(index + 1, category, e)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {saving ? <div className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Saving monthly goals to Google Sheets...</div> : null}
      <FormActions onCancel={onCancel} submitLabel={saving ? "Saving..." : "Save monthly goals"} disabled={saving} />
    </form>
  );
}

function BulkAchievementForm({ teams, selectedYear, onSave, onCancel, saving = false, rates = {} }) {
  const firstTeam = teams[0];
  const [teamId, setTeamId] = useState(firstTeam?.id || "");
  const [repName, setRepName] = useState(firstTeam?.reps?.[0] || "");
  const [year, setYear] = useState(selectedYear);
  const [amountCurrency, setAmountCurrency] = useState(firstTeam?.currency || "GBP");
  const [grid, setGrid] = useState({});
  const team = getTeam(teams, teamId);
  const teamCurrency = team?.currency || "GBP";
  const achievementCurrencyLabel = amountCurrency;

  function setAmount(month, category, value) {
    setGrid((current) => ({ ...current, [`${month}-${category}`]: value }));
  }

  function cleanPastedAmount(value) {
    return String(value || "")
      .trim()
      .replace(/[₩£€$,\s]/g, "");
  }

  function pasteGrid(startMonth, startCategory, event) {
    const text = event.clipboardData?.getData("text/plain");
    if (!text) return;
    const pastedRows = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("\t").map(cleanPastedAmount));
    if (!pastedRows.length) return;

    event.preventDefault();
    const startCategoryIndex = CATEGORIES.indexOf(startCategory);
    setGrid((current) => {
      const next = { ...current };
      pastedRows.forEach((row, rowOffset) => {
        const month = startMonth + rowOffset;
        if (month > 12) return;
        row.forEach((value, columnOffset) => {
          const category = CATEGORIES[startCategoryIndex + columnOffset];
          if (!category) return;
          next[`${month}-${category}`] = value;
        });
      });
      return next;
    });
  }

  function submit(event) {
    event.preventDefault();
    const rows = [];
    for (let month = 1; month <= 12; month += 1) {
      CATEGORIES.forEach((category) => {
        const rawAmount = grid[`${month}-${category}`];
        if (rawAmount === "" || rawAmount === undefined || rawAmount === null) return;
        const localAmount = num(convertBetween(rawAmount, amountCurrency, teamCurrency, rates));
        rows.push({
          id: createId("deal"),
          teamId,
          repName,
          year: num(year),
          month,
          companyName: "Historical Achievement",
          product: "Closed Achievement Entry",
          category,
          dealType: "Other",
          minAmount: 0,
          maxAmount: localAmount,
          probability: 100,
          temperature: "High",
          status: "Closed",
          closedAmount: localAmount,
          expectedCloseDate: "",
          comments: "Bulk entered previous achievement",
          repComment: "Bulk entered previous achievement",
          managerComment: "",
          nextAction: ""
        });
      });
    }
    onSave(rows);
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="label">Team</label>
          <select
            className="field"
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setRepName(getTeam(teams, e.target.value)?.reps?.[0] || "");
            }}
          >
            {teams.map((item) => (
              <option key={item.id} value={item.id}>
                {item.teamName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Rep</label>
          <select className="field" value={repName} onChange={(e) => setRepName(e.target.value)}>
            {(team?.reps || []).map((rep) => (
              <option key={rep}>{rep}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Amount currency</label>
          <select className="field" value={amountCurrency} onChange={(e) => setAmountCurrency(e.target.value)}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencySymbol(code)} {code}
                {code === teamCurrency ? " (team)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
        Enter previous closed achievements in {achievementCurrencyLabel}. You can paste a block from Excel or Google Sheets. These values are saved as closed achievement entries and will count in Dashboard, Team View, and Summary.
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="table-head">
              <th className="px-3 py-3">Month</th>
              {CATEGORIES.map((category) => (
                <th key={category} className="px-3 py-3">
                  {category}
                  <div className="text-xs font-semibold normal-case text-slate-400">{achievementCurrencyLabel}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((month, index) => (
              <tr key={month}>
                <td className="table-cell font-semibold">{month}</td>
                {CATEGORIES.map((category) => (
                  <td key={category} className="table-cell">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="field min-w-32"
                      value={grid[`${index + 1}-${category}`] || ""}
                      onChange={(e) => setAmount(index + 1, category, e.target.value)}
                      onPaste={(e) => pasteGrid(index + 1, category, e)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {saving ? <div className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Saving closed achievements to Google Sheets...</div> : null}
      <FormActions onCancel={onCancel} submitLabel={saving ? "Saving..." : "Save closed achievements"} disabled={saving} />
    </form>
  );
}

function ChartPanel({ title, children, tall = false }) {
  return (
    <div className="panel p-4">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className={tall ? "h-80" : "h-72"}>{children}</div>
    </div>
  );
}

function Dashboard({ data, selectedYear, selectedMonth, selectedPeriodType, selectedQuarter, selectedHalfYear }) {
  const [goalType, setGoalType] = useStoredState("midas-dashboard-goal-type", "Responsibility Goal");
  const [currencyView, setCurrencyView] = useStoredState("midas-dashboard-currency-view", "KRW");
  const { teams, deals, goals } = data;
  const rates = ratesFromSettings(data.settings, teams);
  const displayCurrency = currencyView;
  const toDisplay = (metrics) => krwToCurrency(metrics, displayCurrency, rates);
  const baseScope = periodScope({
    year: selectedYear,
    periodType: selectedPeriodType,
    month: selectedMonth,
    quarter: selectedQuarter,
    halfYear: selectedHalfYear
  });
  const label = periodLabel({
    year: selectedYear,
    periodType: selectedPeriodType,
    month: selectedMonth,
    quarter: selectedQuarter,
    halfYear: selectedHalfYear
  });
  const metricsKrw = calculateMetrics({
    teams,
    deals,
    goals,
    goalType,
    useKrw: true,
    scope: baseScope
  });
  const metrics = toDisplay(metricsKrw);

  const teamRows = teams.map((team) => {
    const itemMetricsKrw = calculateMetrics({
      teams,
      deals,
      goals,
      goalType,
      useKrw: true,
      scope: { ...baseScope, teamId: team.id }
    });
    const itemMetrics = toDisplay(itemMetricsKrw);
    return {
      id: team.id,
      team: team.teamName,
      lead: team.teamLead,
      ...itemMetrics,
      status: riskFor(itemMetrics)
    };
  });

  const teamChart = teamRows.map((row) => ({
    name: row.team,
    Target: row.target,
    "Achievement + Min": row.achievementMin,
    "Achievement + Max": row.achievementMax
  }));

  const categoryChart = CATEGORIES.map((category) => {
    const categoryMetricsKrw = calculateMetrics({
      teams,
      deals,
      goals,
      goalType,
      useKrw: true,
      scope: { ...baseScope, category }
    });
    const categoryMetrics = toDisplay(categoryMetricsKrw);
    return {
      category,
      "Min Forecast": categoryMetrics.min,
      "Max Upside": Math.max(categoryMetrics.max - categoryMetrics.min, 0)
    };
  });

  const coveragePie = [
    { name: "Closed", value: metrics.closed, color: "#16825d" },
    { name: "Open Min", value: metrics.min, color: "#1d4f8f" },
    { name: "Upside", value: Math.max(metrics.max - metrics.min, 0), color: "#d18b16" },
    { name: "Remaining to Target", value: Math.max(metrics.target - metrics.achievementMax, 0), color: "#c24136" }
  ].filter((item) => item.value > 0);

  const closedHelper = closedAchievementHelper(metrics, displayCurrency);
  const kpis = [
    [`Total Target ${displayCurrency}`, metrics.target, "navy"],
    [`Closed Achievement ${displayCurrency}`, metrics.closed, "green", false, closedHelper.text, closedHelper.tone],
    [`Min Forecast ${displayCurrency}`, metrics.min, "blue"],
    [`Max Forecast ${displayCurrency}`, metrics.max, "blue"],
    [`Achievement + Min Forecast ${displayCurrency}`, metrics.achievementMin, metrics.gapMin >= 0 ? "green" : "amber"],
    [`Achievement + Max Forecast ${displayCurrency}`, metrics.achievementMax, metrics.gapMax >= 0 ? "green" : "amber"],
    [`Gap Using Min ${displayCurrency}`, metrics.gapMin, metrics.gapMin >= 0 ? "green" : "red"],
    [`Gap Using Max ${displayCurrency}`, metrics.gapMax, metrics.gapMax >= 0 ? "green" : "red"],
    ["Min Coverage %", metrics.minCoverage, metrics.minCoverage >= 1 ? "green" : "amber", true],
    ["Max Coverage %", metrics.maxCoverage, metrics.maxCoverage >= 1 ? "green" : "amber", true]
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="section-title">Dashboard</h2>
          <p className="text-sm text-slate-500">
            Management view for {label}, shown in {displayCurrency}.
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 md:w-[34rem]">
          <div>
            <label className="label">Goal type</label>
            <select className="field" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              {GOAL_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Currency view</label>
            <select className="field" value={displayCurrency} onChange={(e) => setCurrencyView(e.target.value)}>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {currencySymbol(code)} {code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(([label, value, tone, isPercent, helper, helperTone]) => (
          <KpiCard key={label} label={label} value={isPercent ? formatPercent(value) : formatMoney(value, displayCurrency)} tone={tone} helper={helper} helperTone={helperTone} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Target vs Achievement Forecast by Team">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => chartAxisTick(value, displayCurrency)} />
              <Tooltip formatter={(value) => formatChartMoney(value, displayCurrency)} />
              <Legend />
              <Bar dataKey="Target" fill="#0f2742" />
              <Bar dataKey="Achievement + Min" fill="#16825d" />
              <Bar dataKey="Achievement + Max" fill="#1d4f8f" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Overall Coverage" tall>
          <div className="grid h-full gap-4 md:grid-cols-[minmax(220px,1fr)_240px] md:items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coveragePie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={102}
                  paddingAngle={3}
                  labelLine={false}
                  label={false}
                >
                  {coveragePie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatChartMoney(value, displayCurrency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 text-sm">
              {coveragePie.map((entry) => {
                const share = metrics.target ? entry.value / metrics.target : 0;
                return (
                  <div key={entry.name} className="flex items-start justify-between gap-3 border-b border-midas-line pb-2 last:border-b-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
                      <span className="font-bold text-midas-ink">{entry.name}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold text-midas-ink">{formatChartMoney(entry.value, displayCurrency)}</div>
                      <div className="text-xs font-semibold text-slate-500">{formatPercent(share)} of target</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartPanel>
        <ChartPanel title="Forecast by Category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => chartAxisTick(value, displayCurrency)} />
              <Tooltip formatter={(value) => formatChartMoney(value, displayCurrency)} />
              <Legend />
              <Bar dataKey="Min Forecast" stackId="a" fill="#16825d" />
              <Bar dataKey="Max Upside" stackId="a" fill="#d18b16" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <div className="panel p-4">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Teams Ranked by Risk</h3>
          <DataTable
            rows={[...teamRows].sort((a, b) => a.maxCoverage - b.maxCoverage)}
            columns={[
              { header: "Team", render: (row) => row.team },
              { header: "Lead", render: (row) => row.lead },
              { header: `Target ${displayCurrency}`, render: (row) => formatMoney(row.target, displayCurrency) },
              { header: `Achievement + Min ${displayCurrency}`, render: (row) => formatMoney(row.achievementMin, displayCurrency) },
              { header: `Achievement + Max ${displayCurrency}`, render: (row) => formatMoney(row.achievementMax, displayCurrency) },
              { header: "Min Coverage", render: (row) => formatPercent(row.minCoverage) },
              { header: "Max Coverage", render: (row) => formatPercent(row.maxCoverage) },
              {
                header: "Status",
                render: (row) => (
                  <Badge tone={row.status === "Safe" ? "green" : row.status === "Possible" ? "amber" : "red"}>{row.status}</Badge>
                )
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function TeamsPage({ data, refreshData }) {
  const [editing, setEditing] = useState(null);

  async function saveTeam(team) {
    // Stamp the currency's central KRW rate onto the persisted row so exports
    // and the raw sheet stay consistent; it is re-derived from Settings on load.
    const withRate = { ...team, krwRate: rateForCurrency(team.currency, data.settings, data.teams) };
    if (data.teams.some((item) => item.id === withRate.id)) await api.updateTeam(withRate.id, withRate);
    else await api.createTeam(withRate);
    await refreshData();
    setEditing(null);
  }

  async function deleteTeam(teamId) {
    if (!confirm("Delete this team and its related deals/goals?")) return;
    await api.deleteTeam(teamId);
    await refreshData();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Teams</h2>
          <p className="text-sm text-slate-500">Manage team setup, currencies, and reps. KRW rates are set centrally in the Exchange Rates bar.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({})}>
          Add Team
        </button>
      </div>
      <div className="panel">
        <DataTable
          rows={data.teams}
          columns={[
            { header: "Team name", render: (row) => row.teamName },
            { header: "Team lead", render: (row) => row.teamLead },
            { header: "Region", render: (row) => row.region },
            { header: "Currency", render: (row) => row.currency },
            { header: "KRW rate (central)", render: (row) => num(row.krwRate).toLocaleString() },
            { header: "Reps", render: (row) => row.reps.join(", ") },
            {
              header: "Edit",
              render: (row) => (
                <button className="btn-secondary" onClick={() => setEditing(row)}>
                  Edit
                </button>
              )
            },
            {
              header: "Delete",
              render: (row) => (
                <button className="btn-danger" onClick={() => deleteTeam(row.id)}>
                  Delete
                </button>
              )
            }
          ]}
        />
      </div>
      {editing ? (
        <Modal title={editing.id ? "Edit Team" : "Add Team"} onClose={() => setEditing(null)}>
          <TeamForm initialTeam={editing.id ? editing : null} onSave={saveTeam} onCancel={() => setEditing(null)} />
        </Modal>
      ) : null}
    </div>
  );
}

function DealsPage({ data, refreshData, selectedYear, selectedMonth, access, connectionStatus = "connected" }) {
  const [editing, setEditing] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [savingDeal, setSavingDeal] = useState(false);
  const [dealSaveError, setDealSaveError] = useState("");
  const [dealSaveNotice, setDealSaveNotice] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);
  const rates = ratesFromSettings(data.settings, data.teams);
  const [filters, setFilters] = useState({
    year: selectedYear,
    month: selectedMonth,
    teamId: "All",
    repName: "All",
    category: "All",
    status: "All",
    search: ""
  });

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function saveDeal(deal) {
    if (connectionStatus !== "connected") {
      setDealSaveError("Google Sheets is not connected. Use Reconnect Google Sheets at the top, then retry this save.");
      return;
    }
    if (!canUseRecord(access, deal)) {
      alert("You can only save deals for your assigned team/rep.");
      return;
    }
    setSavingDeal(true);
    setDealSaveError("");
    setDealSaveNotice("");
    try {
      const editingExisting = data.deals.some((item) => item.id === deal.id);
      if (editingExisting) await api.updateDeal(deal.id, deal);
      else await api.createDeal(deal);
      await refreshData();
      sessionStorage.removeItem(DEAL_DRAFT_KEY);
      setDealSaveNotice(`${deal.companyName} was saved and verified in Google Sheets.`);
      setEditing(null);
    } catch (error) {
      const message = error.message || "Google Sheets did not confirm the save. Your form is still open; please retry.";
      setDealSaveError(message);
    } finally {
      setSavingDeal(false);
    }
  }

  async function saveBulkDeals(rows) {
    if (!rows.length) {
      alert("Enter at least one company and amount before saving.");
      return;
    }
    setSavingBulk(true);
    try {
      if (rows.some((row) => !canUseRecord(access, row))) {
        alert("Bulk deals can only include your assigned team/rep.");
        return;
      }
      await api.createDealsBulk(rows);
      await refreshData();
      setBulkOpen(false);
    } finally {
      setSavingBulk(false);
    }
  }

  async function deleteDeal(dealId) {
    if (!confirm("Delete this deal?")) return;
    await api.deleteDeal(dealId);
    await refreshData();
  }

  const reps = Array.from(new Set(data.teams.flatMap((team) => team.reps))).sort();
  const filteredDeals = data.deals.filter((deal) => {
    if (filters.year !== "All" && num(deal.year) !== num(filters.year)) return false;
    if (filters.month !== "All" && num(deal.month) !== num(filters.month)) return false;
    if (filters.teamId !== "All" && deal.teamId !== filters.teamId) return false;
    if (filters.repName !== "All" && deal.repName !== filters.repName) return false;
    if (filters.category !== "All" && deal.category !== filters.category) return false;
    if (filters.status !== "All" && deal.status !== filters.status) return false;
    if (filters.search && !deal.companyName.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Deals</h2>
          <p className="text-sm text-slate-500">Source of Min/Max forecast and closed achievement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setBulkOpen(true)}>
            Bulk add deals
          </button>
          <button className="btn-primary" onClick={() => { setDealSaveError(""); setEditing({}); }}>
            Add Deal
          </button>
        </div>
      </div>
      {dealSaveNotice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {dealSaveNotice}
        </div>
      ) : null}
      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
          <div>
            <label className="label">Year</label>
            <select className="field" value={filters.year} onChange={(e) => updateFilter("year", e.target.value)}>
              <option>All</option>
              {YEARS.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <select className="field" value={filters.month} onChange={(e) => updateFilter("month", e.target.value)}>
              <option>All</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Team</label>
            <select className="field" value={filters.teamId} onChange={(e) => updateFilter("teamId", e.target.value)}>
              <option>All</option>
              {data.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Rep</label>
            <select className="field" value={filters.repName} onChange={(e) => updateFilter("repName", e.target.value)}>
              <option>All</option>
              {reps.map((rep) => (
                <option key={rep}>{rep}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="field" value={filters.category} onChange={(e) => updateFilter("category", e.target.value)}>
              <option>All</option>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="field" value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
              <option>All</option>
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Search company</label>
            <input className="field" value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} />
          </div>
        </div>
      </div>
      <div className="panel">
        <DataTable
          rows={filteredDeals}
          columns={[
            { header: "Month", render: (row) => `${monthName(row.month)} ${row.year}` },
            { header: "Team", render: (row) => getTeam(data.teams, row.teamId)?.teamName || "" },
            { header: "Rep", render: (row) => row.repName },
            {
              header: "Company",
              render: (row) => (
                <DealHubSpotLink deal={row} />
              )
            },
            { header: "Product", render: (row) => row.product },
            { header: "Category", render: (row) => row.category },
            { header: "Min Amount", render: (row) => formatMoney(row.minAmount, getTeam(data.teams, row.teamId)?.currency) },
            { header: "Max Amount", render: (row) => formatMoney(row.maxAmount, getTeam(data.teams, row.teamId)?.currency) },
            { header: "Min KRW", render: (row) => formatMoney(toKrw(row.minAmount, getTeam(data.teams, row.teamId)), "KRW") },
            { header: "Max KRW", render: (row) => formatMoney(toKrw(row.maxAmount, getTeam(data.teams, row.teamId)), "KRW") },
            { header: "Probability", render: (row) => `${row.probability}%` },
            { header: "Temperature", render: (row) => <Badge tone={temperatureTone(row.temperature)}>{row.temperature}</Badge> },
            { header: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
            { header: "Closed Amount", render: (row) => formatMoney(dealClosedAmount(row), getTeam(data.teams, row.teamId)?.currency) },
            { header: "Closed KRW", render: (row) => formatMoney(toKrw(dealClosedAmount(row), getTeam(data.teams, row.teamId)), "KRW") },
            { header: "Expected Close", render: (row) => row.expectedCloseDate || "-" },
            { header: "Rep Comment", render: (row) => row.repComment || row.comments },
            { header: "Manager Comment", render: (row) => row.managerComment },
            { header: "Next Action", render: (row) => row.nextAction },
            {
              header: "Edit",
              render: (row) => (
                <button className="btn-secondary" onClick={() => { setDealSaveError(""); setEditing(row); }}>
                  Edit
                </button>
              )
            },
            {
              header: "Delete",
              render: (row) => (
                <button className="btn-danger" onClick={() => deleteDeal(row.id)}>
                  Delete
                </button>
              )
            }
          ]}
        />
      </div>
      {editing ? (
        <Modal title={editing.id ? "Edit Deal" : "Add Deal"} onClose={() => { if (!savingDeal) setEditing(null); }}>
          <DealForm
            teams={data.teams}
            initialDeal={editing.id ? editing : null}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSave={saveDeal}
            onCancel={() => setEditing(null)}
            rates={rates}
            saving={savingDeal}
            error={dealSaveError}
          />
        </Modal>
      ) : null}
      {bulkOpen ? (
        <Modal title="Bulk Add Deals" onClose={() => setBulkOpen(false)}>
          <BulkDealForm
            teams={data.teams}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSave={saveBulkDeals}
            onCancel={() => setBulkOpen(false)}
            saving={savingBulk}
            rates={rates}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function GoalsPage({ data, refreshData, selectedYear, selectedMonth }) {
  const [goalType, setGoalType] = useStoredState("midas-goals-goal-type", "Responsibility Goal");
  const [year, setYear] = useStoredState("midas-goals-year", selectedYear);
  const [monthFilter, setMonthFilter] = useStoredState("midas-goals-month", "All");
  const [teamFilter, setTeamFilter] = useStoredState("midas-goals-team", "All");
  const [repFilter, setRepFilter] = useStoredState("midas-goals-rep", "All");
  const [categoryFilter, setCategoryFilter] = useStoredState("midas-goals-category", "All");
  const [editing, setEditing] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [achievementBulkOpen, setAchievementBulkOpen] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [savingAchievements, setSavingAchievements] = useState(false);
  const rates = ratesFromSettings(data.settings, data.teams);

  async function saveGoal(goal) {
    setSavingGoal(true);
    try {
      if (data.goals.some((item) => item.id === goal.id)) await api.updateGoal(goal.id, goal);
      else await api.createGoal(goal);
      await refreshData();
      setEditing(null);
    } finally {
      setSavingGoal(false);
    }
  }

  async function saveBulk(rows) {
    if (!rows.length) {
      alert("Enter at least one monthly goal amount before saving.");
      return;
    }
    setSavingBulk(true);
    try {
      await api.createGoalsBulk(rows);
      await refreshData();
      setBulkOpen(false);
    } finally {
      setSavingBulk(false);
    }
  }

  async function saveAchievementBulk(rows) {
    if (!rows.length) {
      alert("Enter at least one achievement amount before saving.");
      return;
    }
    setSavingAchievements(true);
    try {
      await api.createDealsBulk(rows);
      await refreshData();
      setAchievementBulkOpen(false);
    } finally {
      setSavingAchievements(false);
    }
  }

  async function deleteGoal(goalId) {
    if (!confirm("Delete this monthly goal?")) return;
    await api.deleteGoal(goalId);
    await refreshData();
  }

  const repOptions = Array.from(
    new Set([
      ...(teamFilter === "All" ? data.teams.flatMap((team) => team.reps || []) : getTeam(data.teams, teamFilter)?.reps || []),
      ...data.goals
        .filter((goal) => teamFilter === "All" || goal.teamId === teamFilter)
        .map((goal) => goal.repName)
    ])
  )
    .filter(Boolean)
    .sort();

  useEffect(() => {
    if (repFilter !== "All" && !repOptions.includes(repFilter)) setRepFilter("All");
  }, [repFilter, repOptions, setRepFilter]);

  const rows = data.goals
    .filter((goal) => {
      if (num(goal.year) !== num(year)) return false;
      if (goal.goalType !== goalType) return false;
      if (monthFilter !== "All" && num(goal.month) !== num(monthFilter)) return false;
      if (teamFilter !== "All" && goal.teamId !== teamFilter) return false;
      if (repFilter !== "All" && goal.repName !== repFilter) return false;
      if (categoryFilter !== "All" && goal.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const teamA = getTeam(data.teams, a.teamId)?.teamName || "";
      const teamB = getTeam(data.teams, b.teamId)?.teamName || "";
      return (
        num(a.year) - num(b.year) ||
        num(a.month) - num(b.month) ||
        teamA.localeCompare(teamB) ||
        String(a.repName || "").localeCompare(String(b.repName || "")) ||
        String(a.category || "").localeCompare(String(b.category || ""))
      );
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Monthly Goals</h2>
          <p className="text-sm text-slate-500">Official targets by team, rep, month, category, and goal type. Use bulk achievements to enter previous closed results without recreating historical deals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setAchievementBulkOpen(true)}>
            Bulk add achievements
          </button>
          <button className="btn-secondary" onClick={() => setBulkOpen(true)}>
            Bulk create monthly goals
          </button>
          <button className="btn-primary" onClick={() => setEditing({})}>
            Add Goal
          </button>
        </div>
      </div>
      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <div>
            <label className="label">Year</label>
            <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
              {YEARS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <select className="field" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option>All</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Team</label>
            <select
              className="field"
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value);
                setRepFilter("All");
              }}
            >
              <option>All</option>
              {data.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Rep</label>
            <select className="field" value={repFilter} onChange={(e) => setRepFilter(e.target.value)}>
              <option>All</option>
              {repOptions.map((rep) => (
                <option key={rep}>{rep}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="field" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option>All</option>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Goal type</label>
            <select className="field" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              {GOAL_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => {
                setMonthFilter("All");
                setTeamFilter("All");
                setRepFilter("All");
                setCategoryFilter("All");
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-500">
          Showing {rows.length} goal row{rows.length === 1 ? "" : "s"} for {year}.
        </div>
      </div>
      <div className="panel">
        <DataTable
          rows={rows}
          columns={[
            { header: "Year", render: (row) => row.year },
            { header: "Month", render: (row) => monthName(row.month) },
            { header: "Team", render: (row) => getTeam(data.teams, row.teamId)?.teamName || "" },
            { header: "Rep", render: (row) => row.repName },
            { header: "Category", render: (row) => row.category },
            { header: "Goal Type", render: (row) => row.goalType },
            { header: "Target Local", render: (row) => formatMoney(row.targetAmount, getTeam(data.teams, row.teamId)?.currency) },
            { header: "Target KRW", render: (row) => formatMoney(toKrw(row.targetAmount, getTeam(data.teams, row.teamId)), "KRW") },
            {
              header: "Achievement",
              render: (row) => {
                const achievement = calculateMetrics({
                  teams: data.teams,
                  deals: data.deals,
                  goals: data.goals,
                  goalType: row.goalType,
                  useKrw: false,
                  scope: { year: row.year, month: row.month, teamId: row.teamId, repName: row.repName, category: row.category }
                }).closed;
                return formatMoney(achievement, getTeam(data.teams, row.teamId)?.currency);
              }
            },
            {
              header: "Achievement KRW",
              render: (row) => {
                const achievement = calculateMetrics({
                  teams: data.teams,
                  deals: data.deals,
                  goals: data.goals,
                  goalType: row.goalType,
                  useKrw: true,
                  scope: { year: row.year, month: row.month, teamId: row.teamId, repName: row.repName, category: row.category }
                }).closed;
                return formatMoney(achievement, "KRW");
              }
            },
            {
              header: "Remaining",
              render: (row) => {
                const achievement = calculateMetrics({
                  teams: data.teams,
                  deals: data.deals,
                  goals: data.goals,
                  goalType: row.goalType,
                  useKrw: false,
                  scope: { year: row.year, month: row.month, teamId: row.teamId, repName: row.repName, category: row.category }
                }).closed;
                return formatMoney(achievement - row.targetAmount, getTeam(data.teams, row.teamId)?.currency);
              }
            },
            {
              header: "Coverage %",
              render: (row) => {
                const achievement = calculateMetrics({
                  teams: data.teams,
                  deals: data.deals,
                  goals: data.goals,
                  goalType: row.goalType,
                  useKrw: false,
                  scope: { year: row.year, month: row.month, teamId: row.teamId, repName: row.repName, category: row.category }
                }).closed;
                const coverage = row.targetAmount > 0 ? achievement / row.targetAmount : 0;
                return <span className={`rounded-full px-2 py-1 text-xs font-bold ${coverageClass(coverage, row.targetAmount)}`}>{formatPercent(coverage)}</span>;
              }
            },
            {
              header: "Edit",
              render: (row) => (
                <button className="btn-secondary" onClick={() => setEditing(row)}>
                  Edit
                </button>
              )
            },
            {
              header: "Delete",
              render: (row) => (
                <button className="btn-danger" onClick={() => deleteGoal(row.id)}>
                  Delete
                </button>
              )
            }
          ]}
        />
      </div>
      {editing ? (
        <Modal title={editing.id ? "Edit Goal" : "Add Goal"} onClose={() => setEditing(null)}>
          <GoalForm
            teams={data.teams}
            initialGoal={editing.id ? editing : null}
            selectedYear={year}
            selectedMonth={selectedMonth}
            goalType={goalType}
            onSave={saveGoal}
            onCancel={() => setEditing(null)}
            saving={savingGoal}
            rates={rates}
          />
        </Modal>
      ) : null}
      {bulkOpen ? (
        <Modal title="Bulk Create Monthly Goals" onClose={() => setBulkOpen(false)}>
          <BulkGoalForm
            teams={data.teams}
            selectedYear={year}
            goalType={goalType}
            onSave={saveBulk}
            onCancel={() => setBulkOpen(false)}
            saving={savingBulk}
            rates={rates}
          />
        </Modal>
      ) : null}
      {achievementBulkOpen ? (
        <Modal title="Bulk Add Closed Achievements" onClose={() => setAchievementBulkOpen(false)}>
          <BulkAchievementForm
            teams={data.teams}
            selectedYear={year}
            onSave={saveAchievementBulk}
            onCancel={() => setAchievementBulkOpen(false)}
            saving={savingAchievements}
            rates={rates}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function InlineDealComment({ deal, field, onSave, placeholder, disabled = false }) {
  const initialValue = field === "repComment" ? deal.repComment || deal.comments || "" : deal.managerComment || "";
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const dirty = value !== initialValue;
  const disabledLabel = field === "repComment" ? "Edit in Deals tab" : "Unlock with manager password";

  useEffect(() => {
    setValue(initialValue);
  }, [deal.id, initialValue]);

  async function save() {
    if (!onSave || value === initialValue) return;
    if (disabled) return;
    setSaving(true);
    try {
      const patch = field === "repComment" ? { repComment: value, comments: value } : { managerComment: value };
      await onSave(deal, patch);
    } catch (error) {
      alert(`Could not save comment: ${error.message || "Google Sheets update failed."}`);
      setValue(initialValue);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`comment-cell ${disabled ? "comment-cell-disabled" : ""} ${dirty ? "comment-cell-dirty" : ""}`}>
      <textarea
        className="comment-textarea"
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onBlur={save}
        disabled={saving || disabled}
        rows={3}
      />
      <div className="comment-meta">
        {saving ? <span className="text-blue-700">Saving...</span> : null}
        {!saving && dirty && !disabled ? <span className="text-amber-700">Unsaved</span> : null}
        {disabled ? <span>{disabledLabel}</span> : null}
      </div>
    </div>
  );
}

function DealHubSpotLink({ deal }) {
  const url = safeExternalUrl(deal.hubspotDealUrl);
  if (!url) return deal.companyName;
  return (
    <a
      className="font-semibold text-midas-blue underline decoration-blue-300 underline-offset-2 hover:text-blue-700"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${deal.companyName} in HubSpot`}
      title="Open deal in HubSpot"
    >
      {deal.companyName}
    </a>
  );
}

function ForecastTable({ title, deals, team, currency, displayFactor = 1, includeClosed = false, onSaveComment, canEditManagerNotes = false, onEditDeal, onMoveDeal, canEditDeal }) {
  const openDeals = deals.filter((deal) => deal.status === "Open");
  const closedDeals = deals.filter((deal) => deal.status === "Closed");
  const totalMin = openDeals.reduce((sum, deal) => sum + num(deal.minAmount), 0);
  const totalMax = openDeals.reduce((sum, deal) => sum + num(deal.maxAmount), 0);
  const totalClosed = closedDeals.reduce((sum, deal) => sum + dealClosedAmount(deal), 0);
  // Deal amounts are stored in the team currency; scale them to the display currency.
  const displayAmount = (value) => num(value) * displayFactor;
  const showKrwReference = currency !== "KRW";
  const totalMinDisplay = displayAmount(totalMin);
  const totalMaxDisplay = displayAmount(totalMax);
  const totalClosedDisplay = displayAmount(totalClosed);
  const columns = [
    { header: "Company", render: (row) => <DealHubSpotLink deal={row} /> },
    { header: "Product", render: (row) => row.product },
    { header: "Rep", render: (row) => row.repName },
    ...(includeClosed
      ? [{ header: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> }]
      : []),
    { header: `Min (${currency})`, render: (row) => (row.status === "Open" ? formatMoney(displayAmount(row.minAmount), currency) : "-") },
    { header: `Max (${currency})`, render: (row) => (row.status === "Open" ? formatMoney(displayAmount(row.maxAmount), currency) : "-") },
    ...(includeClosed
      ? [{ header: `Closed (${currency})`, render: (row) => (row.status === "Closed" ? formatMoney(displayAmount(dealClosedAmount(row)), currency) : "-") }]
      : []),
    { header: "Probability", render: (row) => `${row.probability}%` },
    { header: "Temperature", render: (row) => <Badge tone={temperatureTone(row.temperature)}>{row.temperature}</Badge> },
    {
      header: "Rep Comment",
      className: "min-w-[26rem]",
      render: (row) => (
        <div className="max-w-xl whitespace-pre-wrap text-sm leading-6 text-midas-ink">
          {row.repComment || row.comments || "-"}
        </div>
      )
    },
    {
      header: "Manager Comment",
      className: "min-w-[24rem]",
      render: (row) => (
        <InlineDealComment
          deal={row}
          field="managerComment"
          onSave={onSaveComment}
          placeholder="Manager note"
          disabled={!canEditManagerNotes}
        />
      )
    },
    { header: "Next Action", render: (row) => row.nextAction },
    ...(onEditDeal || onMoveDeal
      ? [{
          header: "Actions",
          className: "whitespace-nowrap",
          render: (row) => {
            const allowed = canEditDeal ? canEditDeal(row) : true;
            if (!allowed) return <span className="text-slate-400">-</span>;
            return (
              <div className="flex gap-2">
                {onEditDeal ? (
                  <button className="btn-secondary" onClick={() => onEditDeal(row)}>
                    Edit
                  </button>
                ) : null}
                {onMoveDeal && row.status === "Open" ? (
                  <button className="btn-secondary" onClick={() => onMoveDeal(row)}>
                    Move to next month
                  </button>
                ) : null}
              </div>
            );
          }
        }]
      : [])
  ];

  return (
    <div className="panel">
      <div className="border-b border-midas-line px-4 py-3">
        <h3 className="font-bold text-midas-ink">{title}</h3>
      </div>
      <DataTable
        rows={deals}
        columns={columns}
      />
      <div className="grid gap-3 border-t border-midas-line bg-slate-50 p-4 text-sm font-bold md:grid-cols-5">
        <div>Open Min: {formatMoney(totalMinDisplay, currency)}</div>
        <div>Open Max: {formatMoney(totalMaxDisplay, currency)}</div>
        {includeClosed ? <div>Closed: {formatMoney(totalClosedDisplay, currency)}</div> : null}
        {showKrwReference ? <div>Open Min KRW: {formatMoney(toKrw(totalMin, team), "KRW")}</div> : null}
        {showKrwReference ? <div>Open Max KRW: {formatMoney(toKrw(totalMax, team), "KRW")}</div> : null}
      </div>
    </div>
  );
}

function TeamView({
  data,
  selectedYear,
  selectedMonth,
  selectedPeriodType,
  selectedQuarter,
  selectedHalfYear,
  onUpdateDeal,
  onSaveDeal,
  access,
  canEditManagerNotes = false,
  onUnlockManagerNotes,
  onLockManagerNotes
}) {
  const [teamId, setTeamId] = useStoredState("midas-team-view-team-id", data.teams[0]?.id || "");
  const [year, setYear] = useStoredState("midas-team-view-year", selectedYear);
  const [month, setMonth] = useStoredState("midas-team-view-month", selectedMonth);
  const [periodType, setPeriodType] = useStoredState("midas-team-view-period-type", selectedPeriodType);
  const [quarter, setQuarter] = useStoredState("midas-team-view-quarter", selectedQuarter);
  const [halfYear, setHalfYear] = useStoredState("midas-team-view-half-year", selectedHalfYear);
  const [goalType, setGoalType] = useStoredState("midas-team-view-goal-type", "Responsibility Goal");
  const [repName, setRepName] = useStoredState("midas-team-view-rep", "All reps");
  const [currencyView, setCurrencyView] = useStoredState("midas-team-view-currency-view", "Local");
  const [dealTableView, setDealTableView] = useStoredState("midas-team-view-deal-table-view", "Open only");
  const [managerPassword, setManagerPassword] = useState("");
  const team = getTeam(data.teams, teamId) || data.teams[0];
  const rates = ratesFromSettings(data.settings, data.teams);
  const teamCurrency = team?.currency || "GBP";
  // "Local" shows the team's own currency; otherwise show the picked currency.
  const currency = currencyView === "Local" ? teamCurrency : currencyView;
  // Team View is single-team, so all amounts are in the team currency. Compute
  // metrics in local currency, then scale them into the chosen display currency.
  const displayFactor = num(convertBetween(1, teamCurrency, currency, rates)) || 1;
  const scope = periodScope({ year, periodType, month, quarter, halfYear, teamId: team?.id, repName });
  const label = periodLabel({ year, periodType, month, quarter, halfYear });
  const metrics = scaleMetrics(
    calculateMetrics({ teams: data.teams, deals: data.deals, goals: data.goals, goalType, useKrw: false, scope }),
    displayFactor
  );
  const includeClosedDeals = dealTableView === "Open + Closed" || dealTableView === "Closed only";
  const includeOpenDeals = dealTableView !== "Closed only";
  const tableDeals = data.deals.filter((deal) => {
    if (!matchesScope(deal, scope)) return false;
    if (deal.status === "Open") return includeOpenDeals;
    if (deal.status === "Closed") return includeClosedDeals;
    return false;
  });

  const categoryRows = CATEGORIES.map((category) => {
    const categoryMetrics = scaleMetrics(
      calculateMetrics({
        teams: data.teams,
        deals: data.deals,
        goals: data.goals,
        goalType,
        useKrw: false,
        scope: { ...scope, category }
      }),
      displayFactor
    );
    return { id: category, category, ...categoryMetrics };
  });
  categoryRows.push({ id: "Total", category: "Total", ...metrics });

  const targetForecastChart = categoryRows
    .filter((row) => row.category !== "Total")
    .map((row) => ({
      category: row.category,
      Target: row.target,
      "Achievement + Max": row.achievementMax
    }));

  const coveragePie = [
    { name: "Achievement + Max", value: metrics.achievementMax },
    { name: "Gap to Target", value: Math.max(metrics.target - metrics.achievementMax, 0) }
  ].filter((item) => item.value > 0);

  const splitPie = CATEGORIES.map((category) => {
    const row = categoryRows.find((item) => item.category === category);
    return { name: category, value: row?.max || 0 };
  }).filter((item) => item.value > 0);
  const closedHelper = closedAchievementHelper(metrics, currency);

  let runningSales = 0;
  const monthlySalesChart = periodType === "Monthly"
    ? []
    : scope.months.map((scopeMonth) => {
        const monthMetrics = scaleMetrics(
          calculateMetrics({
            teams: data.teams,
            deals: data.deals,
            goals: data.goals,
            goalType,
            useKrw: false,
            scope: { ...scope, months: [scopeMonth] }
          }),
          displayFactor
        );
        runningSales += monthMetrics.closed;
        return {
          month: monthName(scopeMonth).slice(0, 3),
          Sales: monthMetrics.closed,
          Goal: monthMetrics.target,
          Cumulative: runningSales
        };
      });
  let runningGoal = 0;
  monthlySalesChart.forEach((row) => {
    runningGoal += row.Goal;
    row["Cumulative Goal"] = runningGoal;
  });

  function submitManagerPassword(event) {
    event.preventDefault();
    const result = onUnlockManagerNotes?.(managerPassword);
    if (result) {
      setManagerPassword("");
    }
  }

  const [editingDeal, setEditingDeal] = useState(null);
  const [savingDeal, setSavingDeal] = useState(false);
  const [dealSaveError, setDealSaveError] = useState("");
  const canEditDeal = (deal) => (access ? canUseRecord(access, deal) : true);

  function openDealEditor(deal) {
    setDealSaveError("");
    setEditingDeal(deal);
  }

  async function handleSaveDeal(deal) {
    if (!onSaveDeal) return;
    setSavingDeal(true);
    setDealSaveError("");
    try {
      await onSaveDeal(deal);
      setEditingDeal(null);
    } catch (error) {
      setDealSaveError(error.message || "The deal could not be saved. Please retry.");
    } finally {
      setSavingDeal(false);
    }
  }

  async function moveDealToNextMonth(deal) {
    const dealMonth = num(deal.month) || 1;
    const dealYear = num(deal.year) || year;
    const nextMonth = dealMonth === 12 ? 1 : dealMonth + 1;
    const nextYear = dealMonth === 12 ? dealYear + 1 : dealYear;
    if (!window.confirm(`Move "${deal.companyName}" to ${monthName(nextMonth)} ${nextYear}?`)) return;
    try {
      await onUpdateDeal(deal, { month: nextMonth, year: nextYear });
    } catch (error) {
      alert(error.message || "The deal could not be moved.");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title">Team View</h2>
        <p className="text-sm text-slate-500">Team-level working view for {label}, shown in {currencyView === "Local" ? `${teamCurrency} (team currency)` : currency}.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-midas-line bg-white px-3 py-3 text-xs font-bold shadow-sm">
          <span className={`rounded-full px-3 py-1 ${canEditManagerNotes ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            Manager comments: {canEditManagerNotes ? "unlocked" : "locked"}
          </span>
          {canEditManagerNotes ? (
            <button type="button" className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={onLockManagerNotes}>
              Lock comments
            </button>
          ) : (
            <form className="flex flex-wrap items-center gap-2" onSubmit={submitManagerPassword}>
              <input
                className="h-8 w-36 rounded-full border border-midas-line px-3 text-xs font-bold outline-none focus:border-midas-blue"
                type="password"
                inputMode="numeric"
                value={managerPassword}
                placeholder="Password"
                onChange={(event) => setManagerPassword(event.target.value)}
              />
              <button type="submit" className="rounded-full bg-midas-navy px-3 py-2 text-xs font-bold text-white">
                Unlock comments
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <div>
            <label className="label">Team</label>
            <select
              className="field"
              value={team?.id || ""}
              onChange={(e) => {
                setTeamId(e.target.value);
                setRepName("All reps");
              }}
            >
              {data.teams.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.teamName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
              {YEARS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Period</label>
            <select className="field" value={periodType} onChange={(e) => setPeriodType(e.target.value)}>
              {PERIOD_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{periodType}</label>
            {periodType === "Monthly" ? (
              <select className="field" value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTHS.map((item, index) => (
                  <option key={item} value={index + 1}>
                    {item}
                  </option>
                ))}
              </select>
            ) : null}
            {periodType === "Quarterly" ? (
              <select className="field" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                {QUARTERS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : null}
            {periodType === "Half-Yearly" ? (
              <select className="field" value={halfYear} onChange={(e) => setHalfYear(e.target.value)}>
                {HALF_YEARS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <div>
            <label className="label">Goal type</label>
            <select className="field" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              {GOAL_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Rep</label>
            <select className="field" value={repName} onChange={(e) => setRepName(e.target.value)}>
              <option>All reps</option>
              {(team?.reps || []).map((rep) => (
                <option key={rep}>{rep}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Currency view</label>
            <select className="field" value={currencyView} onChange={(e) => setCurrencyView(e.target.value)}>
              <option value="Local">{`Team currency (${teamCurrency})`}</option>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {currencySymbol(code)} {code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Deal table view</label>
            <select className="field" value={dealTableView} onChange={(e) => setDealTableView(e.target.value)}>
              <option>Open only</option>
              <option>Open + Closed</option>
              <option>Closed only</option>
            </select>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Target" value={formatMoney(metrics.target, currency)} />
        <KpiCard label="Closed Achievement" value={formatMoney(metrics.closed, currency)} tone="green" helper={closedHelper.text} helperTone={closedHelper.tone} />
        <KpiCard label="Min Forecast" value={formatMoney(metrics.min, currency)} tone="blue" />
        <KpiCard label="Max Forecast" value={formatMoney(metrics.max, currency)} tone="blue" />
        <KpiCard label="Achievement + Min" value={formatMoney(metrics.achievementMin, currency)} tone={metrics.gapMin >= 0 ? "green" : "amber"} />
        <KpiCard label="Achievement + Max" value={formatMoney(metrics.achievementMax, currency)} tone={metrics.gapMax >= 0 ? "green" : "amber"} />
        <KpiCard label="Gap Using Min" value={formatMoney(metrics.gapMin, currency)} tone={metrics.gapMin >= 0 ? "green" : "red"} />
        <KpiCard label="Gap Using Max" value={formatMoney(metrics.gapMax, currency)} tone={metrics.gapMax >= 0 ? "green" : "red"} />
        <KpiCard label="Min Coverage %" value={formatPercent(metrics.minCoverage)} tone={metrics.minCoverage >= 1 ? "green" : "amber"} />
        <KpiCard label="Max Coverage %" value={formatPercent(metrics.maxCoverage)} tone={metrics.maxCoverage >= 1 ? "green" : "amber"} />
      </div>
      {CATEGORIES.map((category) => (
        <ForecastTable
          key={category}
          title={`${category} Deals`}
          team={team}
          currency={currency}
          displayFactor={displayFactor}
          includeClosed={includeClosedDeals}
          onSaveComment={onUpdateDeal}
          canEditManagerNotes={canEditManagerNotes}
          onEditDeal={onSaveDeal ? openDealEditor : undefined}
          onMoveDeal={moveDealToNextMonth}
          canEditDeal={canEditDeal}
          deals={tableDeals.filter((deal) => deal.category === category)}
        />
      ))}
      <div className="panel">
        <div className="border-b border-midas-line px-4 py-3">
          <h3 className="font-bold text-midas-ink">Target vs Forecast</h3>
        </div>
        <DataTable
          rows={categoryRows}
          columns={[
            { header: "Category", render: (row) => row.category },
            { header: "Target", render: (row) => formatMoney(row.target, currency) },
            { header: "Closed Achievement", render: (row) => formatMoney(row.closed, currency) },
            { header: "Min Forecast", render: (row) => formatMoney(row.min, currency) },
            { header: "Max Forecast", render: (row) => formatMoney(row.max, currency) },
            { header: "Achievement + Min", render: (row) => formatMoney(row.achievementMin, currency) },
            { header: "Achievement + Max", render: (row) => formatMoney(row.achievementMax, currency) },
            { header: "Gap Using Min", render: (row) => formatMoney(row.gapMin, currency) },
            { header: "Gap Using Max", render: (row) => formatMoney(row.gapMax, currency) },
            { header: "Min Coverage %", render: (row) => formatPercent(row.minCoverage) },
            { header: "Max Coverage %", render: (row) => formatPercent(row.maxCoverage) }
          ]}
        />
      </div>
      {periodType !== "Monthly" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartPanel title={`Monthly Sales vs Goal - ${label}`} tall>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalesChart} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => chartAxisTick(value, currency)} />
                <Tooltip formatter={(value) => formatChartMoney(value, currency)} />
                <Legend />
                <Line type="linear" dataKey="Sales" name="Monthly Sales" stroke="#1d4f8f" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="linear" dataKey="Goal" name="Monthly Goal" stroke="#d18b16" strokeWidth={2.5} strokeDasharray="6 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ChartPanel title={`Cumulative Sales vs Goal - ${label}`} tall>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalesChart} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => chartAxisTick(value, currency)} />
                <Tooltip formatter={(value) => formatChartMoney(value, currency)} />
                <Legend />
                <Line type="linear" dataKey="Cumulative" name="Cumulative Sales" stroke="#16825d" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="linear" dataKey="Cumulative Goal" stroke="#c24136" strokeWidth={2.5} strokeDasharray="6 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartPanel title="Achievement + Max Forecast vs Target">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={coveragePie} dataKey="value" nameKey="name" outerRadius={90} labelLine={false} label={makePieLabel(currency)}>
                {coveragePie.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatChartMoney(value, currency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Category Target vs Forecast">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={targetForecastChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => chartAxisTick(value, currency)} />
              <Tooltip formatter={(value) => formatChartMoney(value, currency)} />
              <Legend />
              <Bar dataKey="Target" fill="#0f2742" />
              <Bar dataKey="Achievement + Max" fill="#16825d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Forecast Split">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={splitPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} labelLine={false} label={makePieLabel(currency)}>
                {splitPie.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatChartMoney(value, currency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
      {editingDeal ? (
        <Modal title="Edit Deal" onClose={() => { if (!savingDeal) setEditingDeal(null); }}>
          <DealForm
            teams={data.teams}
            initialDeal={editingDeal}
            selectedYear={year}
            selectedMonth={month}
            onSave={handleSaveDeal}
            onCancel={() => setEditingDeal(null)}
            rates={rates}
            saving={savingDeal}
            error={dealSaveError}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function IndividualPerformancePage({ data, selectedYear, selectedHalfYear }) {
  const [goalType, setGoalType] = useStoredState("midas-individual-performance-goal-type", "Responsibility Goal");
  const includedTeams = data.teams.filter(isPerformanceTeam);
  const teamIds = includedTeams.map((team) => team.id);
  const [currencyView, setCurrencyView] = useStoredState("midas-individual-performance-currency-view", "EUR");
  const rates = ratesFromSettings(data.settings, data.teams);
  const displayCurrency = currencyView;
  const today = new Date();
  const year = selectedYear ?? today.getFullYear();
  const halfYear = selectedHalfYear ?? (today.getMonth() < 6 ? 1 : 2);
  const label = periodLabel({
    year,
    periodType: "Half-Yearly",
    halfYear
  });
  const baseScope = periodScope({
    year,
    periodType: "Half-Yearly",
    halfYear,
    teamIds
  });
  const reps = Array.from(
    includedTeams.reduce((map, team) => {
      (team.reps || []).forEach((rep) => {
        if (!rep) return;
        const current = map.get(rep) || { repName: rep, teams: [] };
        current.teams.push(team.teamName);
        map.set(rep, current);
      });
      return map;
    }, new Map()).values()
  );

  const rows = reps
    .map((rep) => {
      const metrics = krwToCurrency(calculateMetrics({
        teams: data.teams,
        deals: data.deals,
        goals: data.goals,
        goalType,
        useKrw: true,
        scope: { ...baseScope, repName: rep.repName }
      }), displayCurrency, rates);
      const achievedPercent = metrics.target > 0 ? metrics.closed / metrics.target : 0;
      const remaining = Math.max(metrics.target - metrics.closed, 0);
      return {
        id: rep.repName,
        ...rep,
        ...metrics,
        achievedPercent,
        remaining,
        remainingPercent: metrics.target > 0 ? remaining / metrics.target : 0
      };
    })
    .sort((a, b) => b.achievedPercent - a.achievedPercent || b.closed - a.closed || a.repName.localeCompare(b.repName));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="section-title">Individual Performance</h2>
          <p className="text-sm text-slate-500">
            Big-screen rep ranking for {label}, covering UK, EE1, EE2, and France only. Values shown in {displayCurrency} using central exchange rates.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="w-full sm:w-56">
            <label className="label">Goal type</label>
            <select className="field" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              {GOAL_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label className="label">Currency view</label>
            <select className="field" value={displayCurrency} onChange={(e) => setCurrencyView(e.target.value)}>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {currencySymbol(code)} {code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {rows.map((row, index) => {
          const pieData = [
            { name: "Achieved", value: row.closed, color: "#16825d" },
            { name: "Remaining", value: row.remaining, color: "#c24136" }
          ].filter((item) => item.value > 0);
          if (!pieData.length) pieData.push({ name: "No goal set", value: 1, color: "#cbd5e1" });
          return (
            <div key={row.id} className="panel p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Rank #{index + 1}</div>
                  <h3 className="mt-1 text-2xl font-extrabold text-midas-ink">{row.repName}</h3>
                  <div className="mt-1 text-sm font-semibold text-slate-500">{row.teams.join(", ")}</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-extrabold ${row.achievedPercent >= 1 ? "bg-green-100 text-green-700" : row.achievedPercent >= 0.7 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {formatPercent(row.achievedPercent)}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[190px_1fr] md:items-center">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={2} label={false}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatChartMoney(value, displayCurrency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Goal</div>
                    <div className="text-xl font-extrabold text-midas-ink">{formatChartMoney(row.target, displayCurrency)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Achieved</div>
                    <div className="text-xl font-extrabold text-green-700">{formatChartMoney(row.closed, displayCurrency)} ({formatPercent(row.achievedPercent)})</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Remaining Target</div>
                    <div className="text-xl font-extrabold text-red-700">{formatChartMoney(row.remaining, displayCurrency)} ({formatPercent(row.remainingPercent)})</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!rows.length ? (
        <div className="panel p-5 text-sm font-semibold text-slate-500">
          No reps found in UK, EE1, EE2, or France teams.
        </div>
      ) : null}
    </div>
  );
}

function TeamPerformancePage({ data, selectedYear, selectedHalfYear }) {
  const [goalType, setGoalType] = useStoredState("midas-team-performance-goal-type", "Responsibility Goal");
  const includedTeams = data.teams.filter(isPerformanceTeam);
  const [currencyView, setCurrencyView] = useStoredState("midas-team-performance-currency-view", "EUR");
  const rates = ratesFromSettings(data.settings, data.teams);
  const displayCurrency = currencyView;
  const today = new Date();
  const year = selectedYear ?? today.getFullYear();
  const halfYear = selectedHalfYear ?? (today.getMonth() < 6 ? 1 : 2);
  const label = periodLabel({
    year,
    periodType: "Half-Yearly",
    halfYear
  });
  const baseScope = periodScope({
    year,
    periodType: "Half-Yearly",
    halfYear
  });

  const rows = includedTeams
    .map((team) => {
      const metrics = krwToCurrency(calculateMetrics({
        teams: data.teams,
        deals: data.deals,
        goals: data.goals,
        goalType,
        useKrw: true,
        scope: { ...baseScope, teamId: team.id }
      }), displayCurrency, rates);
      const achievedPercent = metrics.target > 0 ? metrics.closed / metrics.target : 0;
      const remaining = Math.max(metrics.target - metrics.closed, 0);
      const reps = (team.reps || [])
        .map((repName) => {
          const repMetrics = krwToCurrency(calculateMetrics({
            teams: data.teams,
            deals: data.deals,
            goals: data.goals,
            goalType,
            useKrw: true,
            scope: { ...baseScope, teamId: team.id, repName }
          }), displayCurrency, rates);
          const repPercent = repMetrics.target > 0 ? repMetrics.closed / repMetrics.target : 0;
          return {
            id: `${team.id}-${repName}`,
            repName,
            ...repMetrics,
            achievedPercent: repPercent,
            remaining: Math.max(repMetrics.target - repMetrics.closed, 0)
          };
        })
        .sort((a, b) => b.achievedPercent - a.achievedPercent || b.closed - a.closed || a.repName.localeCompare(b.repName));
      return {
        id: team.id,
        team,
        ...metrics,
        achievedPercent,
        remaining,
        remainingPercent: metrics.target > 0 ? remaining / metrics.target : 0,
        reps
      };
    })
    .sort((a, b) => b.achievedPercent - a.achievedPercent || b.closed - a.closed || a.team.teamName.localeCompare(b.team.teamName));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="section-title">Team Performance</h2>
          <p className="text-sm text-slate-500">
            Big-screen team ranking for {label}, covering UK, EE1, EE2, and France only. Values shown in {displayCurrency} using central exchange rates.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="w-full sm:w-56">
            <label className="label">Goal type</label>
            <select className="field" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              {GOAL_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label className="label">Currency view</label>
            <select className="field" value={displayCurrency} onChange={(e) => setCurrencyView(e.target.value)}>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {currencySymbol(code)} {code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((row, index) => {
          const pieData = [
            { name: "Achieved", value: row.closed, color: "#16825d" },
            { name: "Remaining", value: row.remaining, color: "#c24136" }
          ].filter((item) => item.value > 0);
          if (!pieData.length) pieData.push({ name: "No goal set", value: 1, color: "#cbd5e1" });
          return (
            <div key={row.id} className="panel p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Rank #{index + 1}</div>
                  <h3 className="mt-1 text-2xl font-extrabold text-midas-ink">{row.team.teamName}</h3>
                  <div className="mt-1 text-sm font-semibold text-slate-500">Lead: {row.team.teamLead || "-"}</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-extrabold ${row.achievedPercent >= 1 ? "bg-green-100 text-green-700" : row.achievedPercent >= 0.7 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {formatPercent(row.achievedPercent)}
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[190px_1fr] lg:items-center">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={2} label={false}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatChartMoney(value, displayCurrency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Team Goal</div>
                      <div className="text-lg font-extrabold text-midas-ink">{formatChartMoney(row.target, displayCurrency)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Achieved</div>
                      <div className="text-lg font-extrabold text-green-700">{formatChartMoney(row.closed, displayCurrency)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Remaining</div>
                      <div className="text-lg font-extrabold text-red-700">{formatChartMoney(row.remaining, displayCurrency)}</div>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-midas-line pt-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Rep performance</div>
                    {row.reps.map((rep) => {
                      const capped = Math.min(rep.achievedPercent * 100, 140);
                      const width = `${Math.min(capped, 100)}%`;
                      const barColor = rep.achievedPercent >= 1 ? "bg-green-600" : rep.achievedPercent >= 0.7 ? "bg-amber-500" : "bg-red-500";
                      return (
                        <div key={rep.id}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-sm font-bold">
                            <span className="text-midas-ink">{rep.repName}</span>
                            <span className={rep.achievedPercent >= 1 ? "text-green-700" : rep.achievedPercent >= 0.7 ? "text-amber-700" : "text-red-700"}>
                              {formatPercent(rep.achievedPercent)}
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width }} />
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {formatChartMoney(rep.closed, displayCurrency)} achieved / {formatChartMoney(rep.target, displayCurrency)} goal
                          </div>
                        </div>
                      );
                    })}
                    {!row.reps.length ? <div className="text-sm font-semibold text-slate-500">No reps listed for this team.</div> : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!rows.length ? (
        <div className="panel p-5 text-sm font-semibold text-slate-500">No UK, EE1, EE2, or France teams found for the current half-year view.</div>
      ) : null}
    </div>
  );
}

function SummaryPage({ data, selectedYear, selectedMonth, selectedPeriodType, selectedQuarter, selectedHalfYear }) {
  const [year, setYear] = useStoredState("midas-summary-year", selectedYear);
  const [month, setMonth] = useStoredState("midas-summary-month", selectedMonth);
  const [periodType, setPeriodType] = useStoredState("midas-summary-period-type", selectedPeriodType);
  const [quarter, setQuarter] = useStoredState("midas-summary-quarter", selectedQuarter);
  const [halfYear, setHalfYear] = useStoredState("midas-summary-half-year", selectedHalfYear);
  const [goalType, setGoalType] = useStoredState("midas-summary-goal-type", "Responsibility Goal");
  const [currencyView, setCurrencyView] = useStoredState("midas-summary-currency-view", "KRW");
  const [selectedTeamIds, setSelectedTeamIds] = useStoredState("midas-summary-team-ids", null);
  const [teamFilterOpen, setTeamFilterOpen] = useState(false);
  const rates = ratesFromSettings(data.settings, data.teams);
  const displayCurrency = currencyView;
  const toDisplay = (metrics) => krwToCurrency(metrics, displayCurrency, rates);
  const allTeamIds = data.teams.map((team) => team.id);
  const activeTeamIds = selectedTeamIds ?? allTeamIds;
  const selectedTeams = data.teams.filter((team) => activeTeamIds.includes(team.id));
  const teamFilterLabel =
    activeTeamIds.length === data.teams.length
      ? "All teams"
      : activeTeamIds.length
        ? `${activeTeamIds.length} selected`
        : "No teams selected";
  const baseScope = periodScope({ year, periodType, month, quarter, halfYear, teamIds: activeTeamIds });
  const label = periodLabel({ year, periodType, month, quarter, halfYear });
  const metricsKrw = calculateMetrics({
    teams: data.teams,
    deals: data.deals,
    goals: data.goals,
    goalType,
    useKrw: true,
    scope: baseScope
  });
  const metrics = toDisplay(metricsKrw);

  function toggleTeam(teamId) {
    setSelectedTeamIds((current) => {
      const currentIds = current ?? allTeamIds;
      return currentIds.includes(teamId) ? currentIds.filter((id) => id !== teamId) : [...currentIds, teamId];
    });
  }

  const teamRows = selectedTeams.map((team) => {
    const itemMetricsKrw = calculateMetrics({
      teams: data.teams,
      deals: data.deals,
      goals: data.goals,
      goalType,
      useKrw: true,
      scope: { ...baseScope, teamId: team.id }
    });
    const itemMetrics = toDisplay(itemMetricsKrw);
    return { id: team.id, team, ...itemMetrics, status: riskFor(itemMetrics) };
  });

  const categoryRows = CATEGORIES.map((category) => {
    const itemMetricsKrw = calculateMetrics({
      teams: data.teams,
      deals: data.deals,
      goals: data.goals,
      goalType,
      useKrw: true,
      scope: { ...baseScope, category }
    });
    const itemMetrics = toDisplay(itemMetricsKrw);
    return { id: category, category, ...itemMetrics };
  });
  categoryRows.push({ id: "Total", category: "Total", ...metrics });

  const teamChart = teamRows.map((row) => ({
    team: row.team.teamName,
    Target: row.target,
    "Achievement + Max": row.achievementMax
  }));

  const categoryChart = categoryRows
    .filter((row) => row.category !== "Total")
    .map((row) => ({
      category: row.category,
      Target: row.target,
      "Achievement + Max": row.achievementMax
    }));

  const coveragePie = [
    { name: "Achievement + Max", value: metrics.achievementMax },
    { name: "Gap to Target", value: Math.max(metrics.target - metrics.achievementMax, 0) }
  ].filter((item) => item.value > 0);

  const forecastPie = CATEGORIES.map((category) => {
    const row = categoryRows.find((item) => item.category === category);
    return { name: category, value: row?.max || 0 };
  }).filter((item) => item.value > 0);

  function money(value, team) {
    return formatMoney(value, displayCurrency);
  }
  const closedHelper = closedAchievementHelper(metrics, displayCurrency);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title">Summary</h2>
        <p className="text-sm text-slate-500">
          Combined manager view for {label}, covering {selectedTeams.length || 0} of {data.teams.length} teams. KRW is recommended for cross-team totals.
        </p>
      </div>
      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-6 xl:grid-cols-7">
          <div>
            <label className="label">Year</label>
            <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
              {YEARS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Period</label>
            <select className="field" value={periodType} onChange={(e) => setPeriodType(e.target.value)}>
              {PERIOD_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{periodType}</label>
            {periodType === "Monthly" ? (
              <select className="field" value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTHS.map((item, index) => (
                  <option key={item} value={index + 1}>
                    {item}
                  </option>
                ))}
              </select>
            ) : null}
            {periodType === "Quarterly" ? (
              <select className="field" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                {QUARTERS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : null}
            {periodType === "Half-Yearly" ? (
              <select className="field" value={halfYear} onChange={(e) => setHalfYear(e.target.value)}>
                {HALF_YEARS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <div>
            <label className="label">Goal type</label>
            <select className="field" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              {GOAL_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Currency view</label>
            <select className="field" value={displayCurrency} onChange={(e) => setCurrencyView(e.target.value)}>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {currencySymbol(code)} {code}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 border-t border-midas-line pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="label mb-1">Team filter</div>
              <div className="text-sm font-semibold text-slate-500">{teamFilterLabel}</div>
            </div>
            <button className="btn-secondary" onClick={() => setTeamFilterOpen((open) => !open)}>
              {teamFilterOpen ? "Hide teams" : "Choose teams"}
            </button>
          </div>
          {teamFilterOpen ? (
            <div className="mt-4 rounded-lg border border-midas-line bg-slate-50 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                <button className="btn-secondary py-1.5 text-sm" onClick={() => setSelectedTeamIds(allTeamIds)}>
                  Select all
                </button>
                <button className="btn-secondary py-1.5 text-sm" onClick={() => setSelectedTeamIds([])}>
                  Clear
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.teams.map((team) => (
                  <label key={team.id} className="flex items-center gap-2 rounded-md border border-midas-line bg-white px-3 py-2 text-sm font-semibold text-midas-ink">
                    <input type="checkbox" checked={activeTeamIds.includes(team.id)} onChange={() => toggleTeam(team.id)} />
                    <span>{team.teamName}</span>
                  </label>
                ))}
              </div>
              {!activeTeamIds.length ? <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">No teams selected. Summary totals will show zero until at least one team is selected.</div> : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={`Total Target ${displayCurrency}`} value={money(metrics.target)} />
        <KpiCard label={`Closed Achievement ${displayCurrency}`} value={money(metrics.closed)} tone="green" helper={closedHelper.text} helperTone={closedHelper.tone} />
        <KpiCard label={`Min Forecast ${displayCurrency}`} value={money(metrics.min)} tone="blue" />
        <KpiCard label={`Max Forecast ${displayCurrency}`} value={money(metrics.max)} tone="blue" />
        <KpiCard label={`Achievement + Min ${displayCurrency}`} value={money(metrics.achievementMin)} tone={metrics.gapMin >= 0 ? "green" : "amber"} />
        <KpiCard label={`Achievement + Max ${displayCurrency}`} value={money(metrics.achievementMax)} tone={metrics.gapMax >= 0 ? "green" : "amber"} />
        <KpiCard label={`Gap Using Min ${displayCurrency}`} value={money(metrics.gapMin)} tone={metrics.gapMin >= 0 ? "green" : "red"} />
        <KpiCard label={`Gap Using Max ${displayCurrency}`} value={money(metrics.gapMax)} tone={metrics.gapMax >= 0 ? "green" : "red"} />
        <KpiCard label="Min Coverage %" value={formatPercent(metrics.minCoverage)} tone={metrics.minCoverage >= 1 ? "green" : "amber"} />
        <KpiCard label="Max Coverage %" value={formatPercent(metrics.maxCoverage)} tone={metrics.maxCoverage >= 1 ? "green" : "amber"} />
      </div>
      <div className="panel">
        <div className="border-b border-midas-line px-4 py-3">
          <h3 className="font-bold text-midas-ink">Team Summary</h3>
        </div>
        <DataTable
          rows={teamRows}
          columns={[
            { header: "Team", render: (row) => row.team.teamName },
            { header: "Team Lead", render: (row) => row.team.teamLead },
            { header: "Currency", render: (row) => row.team.currency },
            { header: "KRW Rate", render: (row) => row.team.krwRate.toLocaleString() },
            { header: `Target ${displayCurrency}`, render: (row) => money(row.target, row.team) },
            { header: `Closed Achievement ${displayCurrency}`, render: (row) => money(row.closed, row.team) },
            { header: `Min Forecast ${displayCurrency}`, render: (row) => money(row.min, row.team) },
            { header: `Max Forecast ${displayCurrency}`, render: (row) => money(row.max, row.team) },
            { header: `Achievement + Min ${displayCurrency}`, render: (row) => money(row.achievementMin, row.team) },
            { header: `Achievement + Max ${displayCurrency}`, render: (row) => money(row.achievementMax, row.team) },
            { header: `Gap Using Min ${displayCurrency}`, render: (row) => money(row.gapMin, row.team) },
            { header: `Gap Using Max ${displayCurrency}`, render: (row) => money(row.gapMax, row.team) },
            { header: "Min Coverage %", render: (row) => formatPercent(row.minCoverage) },
            { header: "Max Coverage %", render: (row) => formatPercent(row.maxCoverage) },
            {
              header: "Status",
              render: (row) => (
                <Badge tone={row.status === "Safe" ? "green" : row.status === "Possible" ? "amber" : "red"}>{row.status}</Badge>
              )
            }
          ]}
        />
      </div>
      <div className="panel">
        <div className="border-b border-midas-line px-4 py-3">
          <h3 className="font-bold text-midas-ink">Category Summary</h3>
        </div>
        <DataTable
          rows={categoryRows}
          columns={[
            { header: "Category", render: (row) => row.category },
            { header: `Target ${displayCurrency}`, render: (row) => money(row.target) },
            { header: `Closed Achievement ${displayCurrency}`, render: (row) => money(row.closed) },
            { header: `Min Forecast ${displayCurrency}`, render: (row) => money(row.min) },
            { header: `Max Forecast ${displayCurrency}`, render: (row) => money(row.max) },
            { header: `Achievement + Min ${displayCurrency}`, render: (row) => money(row.achievementMin) },
            { header: `Achievement + Max ${displayCurrency}`, render: (row) => money(row.achievementMax) },
            { header: `Gap Using Min ${displayCurrency}`, render: (row) => money(row.gapMin) },
            { header: `Gap Using Max ${displayCurrency}`, render: (row) => money(row.gapMax) },
            { header: "Min Coverage %", render: (row) => formatPercent(row.minCoverage) },
            { header: "Max Coverage %", render: (row) => formatPercent(row.maxCoverage) }
          ]}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Team Target vs Forecast">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
              <YAxis tickFormatter={(value) => chartAxisTick(value, displayCurrency)} />
              <Tooltip formatter={(value) => formatChartMoney(value, displayCurrency)} />
              <Legend />
              <Bar dataKey="Target" fill="#0f2742" />
              <Bar dataKey="Achievement + Max" fill="#16825d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Category Target vs Forecast">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => chartAxisTick(value, displayCurrency)} />
              <Tooltip formatter={(value) => formatChartMoney(value, displayCurrency)} />
              <Legend />
              <Bar dataKey="Target" fill="#0f2742" />
              <Bar dataKey="Achievement + Max" fill="#16825d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Total Coverage" tall>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={coveragePie}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                labelLine={false}
                label={makePieLabel(displayCurrency)}
              >
                {coveragePie.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatChartMoney(value, displayCurrency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Forecast by Category" tall>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={forecastPie}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                labelLine={false}
                label={makePieLabel(displayCurrency)}
              >
                {forecastPie.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatChartMoney(value, displayCurrency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(emptyData);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(6);
  const [selectedPeriodType, setSelectedPeriodType] = useState("Monthly");
  const [selectedQuarter, setSelectedQuarter] = useState(2);
  const [selectedHalfYear, setSelectedHalfYear] = useState(1);
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [appError, setAppError] = useState("");
  const [importJob, setImportJob] = useState(null);
  const [importing, setImporting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshingSheets, setRefreshingSheets] = useState(false);
  const [sheetsConnection, setSheetsConnection] = useState(() => api.getGoogleSheetsConnection?.().status || "reconnect");
  const [connectionMessage, setConnectionMessage] = useState(() => {
    const connection = api.getGoogleSheetsConnection?.();
    return connection?.connected ? "Google Sheets access is active." : "Reconnect before saving changes.";
  });
  const [reconnectingSheets, setReconnectingSheets] = useState(false);
  const [userEmail, setUserEmail] = useState(() => api.getUserEmail());
  const [userGoogleSub, setUserGoogleSub] = useState(() => api.getUserGoogleSub?.() || "");
  const [emailLookupError, setEmailLookupError] = useState(() => api.getUserEmailError?.() || "");
  const [managerCommentUnlocked, setManagerCommentUnlocked] = useState(
    () => sessionStorage.getItem(MANAGER_COMMENT_UNLOCK_KEY) === "true"
  );

  useEffect(() => {
    function handleConnectionChange(event) {
      const detail = event.detail || {};
      setSheetsConnection(detail.status || "reconnect");
      setConnectionMessage(
        detail.status === "connected"
          ? detail.email
            ? `Connected to Google Sheets as ${detail.email}.`
            : detail.message || "Google Sheets connection confirmed."
          : detail.message || "Reconnect before saving changes."
      );
      if (detail.status === "denied") {
        setAuthenticated(false);
        setDataLoaded(false);
        setData(emptyData);
        setAppError(detail.message || "This Google account cannot access the forecast spreadsheet.");
      }
    }
    window.addEventListener("midas-google-sheets-connection", handleConnectionChange);
    return () => window.removeEventListener("midas-google-sheets-connection", handleConnectionChange);
  }, []);

  useEffect(() => {
    async function boot() {
      try {
        api.consumeRedirectToken();
        const status = await api.authStatus();
        if (status.passwordRequired && !status.authenticated) {
          sessionStorage.removeItem("midas-authenticated");
          setAuthenticated(false);
          setAuthChecked(true);
          return;
        }
        setAuthenticated(true);
        await refreshData(true);
      } catch (error) {
        setAppError(error.message || "Could not connect to the local server.");
      } finally {
        setAuthChecked(true);
      }
    }
    boot();
  }, []);

  useEffect(() => {
    if (!authenticated || !dataLoaded) return undefined;
    let stopped = false;
    async function keepConnectionAlive() {
      try {
        const connection = await api.checkGoogleSheetsConnection({ force: false });
        if (!stopped) {
          setSheetsConnection(connection.status);
          setConnectionMessage(connection.email ? `Connected to Google Sheets as ${connection.email}.` : "Google Sheets connection confirmed.");
        }
      } catch (error) {
        if (!stopped) {
          setSheetsConnection(error.status === 403 ? "denied" : "reconnect");
          setConnectionMessage(error.message || "Google Sheets connection expired. Reconnect before saving.");
        }
      }
    }
    function checkWhenVisible() {
      if (document.visibilityState === "visible") keepConnectionAlive();
    }
    keepConnectionAlive();
    const timer = window.setInterval(keepConnectionAlive, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", checkWhenVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [authenticated, dataLoaded]);

  async function refreshData(force = false) {
    try {
      const resolvedEmail = await api.ensureUserEmail();
      setUserEmail(resolvedEmail || "");
      setUserGoogleSub(api.getUserGoogleSub?.() || "");
      setEmailLookupError(api.getUserEmailError?.() || "");
      const cachedData = !force ? api.getCachedData() : null;
      const nextData = cachedData || (await api.readAllData());
      try {
        const savedDraft = JSON.parse(sessionStorage.getItem(DEAL_DRAFT_KEY) || "null");
        if (savedDraft?.id && nextData.deals.some((deal) => deal.id === savedDraft.id)) {
          sessionStorage.removeItem(DEAL_DRAFT_KEY);
        }
      } catch {
        sessionStorage.removeItem(DEAL_DRAFT_KEY);
      }
      const finalEmail = api.getUserEmail() || resolvedEmail || "";
      setUserEmail(finalEmail);
      setUserGoogleSub(api.getUserGoogleSub?.() || "");
      setEmailLookupError(api.getUserEmailError?.() || "");
      setData((current) => ({
        ...current,
        teams: applyRatesToTeams(nextData.teams, nextData.settings),
        deals: nextData.deals,
        goals: nextData.goals,
        roles: nextData.roles || [],
        settings: nextData.settings,
        preparedBy: nextData.settings?.preparedFor || "Vito Lee",
        lastUpdated: new Date().toISOString()
      }));
      setAuthenticated(true);
      setDataLoaded(true);
      setAppError("");
      return true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        sessionStorage.removeItem("midas-authenticated");
        const denied = error.status === 403;
        setSheetsConnection(denied ? "denied" : "reconnect");
        setConnectionMessage(error.message || (denied ? "This Google account cannot access the forecast spreadsheet." : "Google Sheets connection expired. Reconnect before saving."));
        if (denied) {
          setAuthenticated(false);
          setDataLoaded(false);
          setData(emptyData);
          setAppError(error.message || "This Google account cannot access the forecast spreadsheet.");
        } else if (!dataLoaded) {
          setAuthenticated(false);
        }
      } else {
        setAppError(error.message || "Could not load backend data.");
        setDataLoaded(true);
      }
      return false;
    }
  }

  async function manualRefreshData() {
    setRefreshingSheets(true);
    setSheetsConnection("checking");
    setConnectionMessage("Checking live access to Google Sheets...");
    try {
      await refreshData(true);
      const connection = api.getGoogleSheetsConnection?.();
      if (connection?.connected) {
        setSheetsConnection("connected");
        setConnectionMessage(connection.email ? `Connected to Google Sheets as ${connection.email}.` : "Google Sheets connection confirmed.");
      }
    } finally {
      setRefreshingSheets(false);
    }
  }

  async function reconnectGoogleSheets() {
    setReconnectingSheets(true);
    setSheetsConnection("checking");
    setConnectionMessage("Waiting for Google account authorization...");
    setAppError("");
    try {
      await api.login();
      setAuthenticated(false);
      setDataLoaded(false);
      setData(emptyData);
      const connection = await api.checkGoogleSheetsConnection({ force: true });
      if (!connection.connected) throw new Error("This Google account is not authorized for the forecast spreadsheet.");
      const dataAuthorized = await refreshData(true);
      const verifiedConnection = api.getGoogleSheetsConnection?.();
      if (!dataAuthorized || !verifiedConnection?.connected) {
        const authorizationError = new Error("This Google account is not listed in UserRoles for the forecast.");
        authorizationError.status = verifiedConnection?.status === "denied" ? 403 : 401;
        throw authorizationError;
      }
      setSheetsConnection("connected");
      setConnectionMessage(verifiedConnection.email ? `Connected to Google Sheets as ${verifiedConnection.email}.` : "Google Sheets connection renewed and confirmed.");
    } catch (error) {
      const denied = error.status === 403;
      setSheetsConnection(denied ? "denied" : "reconnect");
      setConnectionMessage(error.message || "Google sign-in failed. Try the full-page sign-in option.");
      setAppError(error.message || "Google sign-in failed. Try an account with spreadsheet access.");
    } finally {
      setReconnectingSheets(false);
    }
  }

  async function reconnectGoogleIdentity() {
    try {
      await api.logout();
      api.redirectLogin();
    } catch (error) {
      alert(`Google identity reconnect failed: ${error.message || "Please try signing in again."}`);
    }
  }

  function unlockManagerNotes(password) {
    if (!MANAGER_COMMENT_UNLOCK_CODE) {
      alert("Manager comment unlock code is not configured.");
      return false;
    }
    if (String(password).trim() !== MANAGER_COMMENT_UNLOCK_CODE) {
      alert("Incorrect manager comment password.");
      return false;
    }
    sessionStorage.setItem(MANAGER_COMMENT_UNLOCK_KEY, "true");
    setManagerCommentUnlocked(true);
    return true;
  }

  function lockManagerNotes() {
    sessionStorage.removeItem(MANAGER_COMMENT_UNLOCK_KEY);
    setManagerCommentUnlocked(false);
  }

  function setPreparedBy(preparedBy) {
    setData((current) => ({ ...current, preparedBy }));
  }

  async function saveRates(nextRates) {
    const settings = {
      ...data.settings,
      rateGBP: String(num(nextRates.GBP)),
      rateEUR: String(num(nextRates.EUR)),
      rateUSD: String(num(nextRates.USD))
    };
    // Persist centrally first, then re-derive every team's rate from settings.
    await api.updateSettings(settings);
    setData((current) => ({
      ...current,
      settings,
      teams: applyRatesToTeams(current.teams, settings),
      lastUpdated: new Date().toISOString()
    }));
  }

  function exportCsv(type) {
    api.exportCsv(type);
  }

  async function exportJson() {
    const backup = await api.exportJson();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `midas-sales-full-backup-${selectedYear}-${selectedMonth}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(type, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const preview = await api.previewCsv(type, file);
      setImportJob({ type, file, preview });
    } catch (error) {
      alert(`CSV preview failed: ${error.message || "the selected file is not valid."}`);
    } finally {
      event.target.value = "";
    }
  }

  async function confirmCsvImport() {
    if (!importJob) return;
    const updateCount = importJob.preview?.summary?.updated || 0;
    if (
      updateCount &&
      !confirm(
        `This CSV will update ${updateCount} existing ${importJob.type} record${updateCount === 1 ? "" : "s"}.\n\nExisting records are not deleted, but matching rows can be overwritten with values from the CSV, including accidental blank fields.\n\nContinue with import?`
      )
    ) {
      return;
    }
    setImporting(true);
    try {
      await api.importCsv(importJob.type, importJob.file);
      await refreshData();
      setImportJob(null);
    } catch (error) {
      alert(`CSV import failed: ${error.message || "the selected file could not be imported."}`);
    } finally {
      setImporting(false);
    }
  }

  async function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!confirm("Importing JSON backup will replace all teams, deals, goals, and settings in Google Sheets. Continue?")) return;
      await api.importJson(imported);
      await refreshData();
    } catch (error) {
      alert(`JSON import failed: ${error.message || "the selected file is not a valid backup."}`);
    } finally {
      event.target.value = "";
    }
  }

  async function createServerBackup() {
    const result = await api.createBackup();
    alert(`Backup created: ${result.filename}`);
  }

  const currentUserEmail = userEmail || api.getUserEmail();
  const currentUserGoogleSub = userGoogleSub || api.getUserGoogleSub?.() || "";
  const access = accessForUser(data.roles, currentUserEmail, currentUserGoogleSub);
  const isManager = isManagerAccess(access);
  const canEditManagerNotes = managerCommentUnlocked;
  const scopedData = scopedDataForAccess(data, access);
  const availableTabs = isManager ? TABS : TABS.filter((tab) => !["Teams", "Monthly Goals"].includes(tab));

  async function updateDealFromTeamView(deal, patch) {
    const existing = data.deals.find((item) => item.id === deal.id);
    if (!existing) throw new Error("Deal was not found.");
    if (!canUseRecord(access, existing)) throw new Error("You can only update deals for your assigned team/rep.");
    if (Object.prototype.hasOwnProperty.call(patch, "managerComment") && !canEditManagerNotes) {
      throw new Error("Unlock manager comments with the local password first.");
    }
    const nextDeal = normalizeDeal({ ...existing, ...patch });
    const saved = await api.updateDeal(existing.id, nextDeal);
    const normalizedSaved = normalizeDeal({ ...nextDeal, ...saved });
    setData((current) => ({
      ...current,
      deals: current.deals.map((item) => (item.id === existing.id ? normalizedSaved : item)),
      lastUpdated: new Date().toISOString()
    }));
  }

  async function saveDealFromTeamView(deal) {
    const existing = data.deals.find((item) => item.id === deal.id);
    if (!existing) throw new Error("Deal was not found.");
    if (!canUseRecord(access, existing)) throw new Error("You can only update deals for your assigned team/rep.");
    // Editing the full deal is allowed, but the manager comment stays locked
    // unless it was explicitly unlocked with the local password.
    const merged = { ...existing, ...deal };
    if (!canEditManagerNotes) merged.managerComment = existing.managerComment;
    const nextDeal = normalizeDeal(merged);
    const saved = await api.updateDeal(existing.id, nextDeal);
    const normalizedSaved = normalizeDeal({ ...nextDeal, ...saved });
    setData((current) => ({
      ...current,
      deals: current.deals.map((item) => (item.id === existing.id ? normalizedSaved : item)),
      lastUpdated: new Date().toISOString()
    }));
  }

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) setActiveTab(availableTabs[0] || "Dashboard");
  }, [activeTab, availableTabs.join("|")]);

  const content = {
    Dashboard: (
      <Dashboard
        data={scopedData}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedPeriodType={selectedPeriodType}
        selectedQuarter={selectedQuarter}
        selectedHalfYear={selectedHalfYear}
      />
    ),
    Teams: <TeamsPage data={data} refreshData={refreshData} />,
    Deals: <DealsPage data={scopedData} refreshData={refreshData} selectedYear={selectedYear} selectedMonth={selectedMonth} access={access} connectionStatus={sheetsConnection} />,
    "Monthly Goals": <GoalsPage data={data} refreshData={refreshData} selectedYear={selectedYear} selectedMonth={selectedMonth} />,
    "Team View": (
      <TeamView
        data={scopedData}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedPeriodType={selectedPeriodType}
        selectedQuarter={selectedQuarter}
        selectedHalfYear={selectedHalfYear}
        onUpdateDeal={updateDealFromTeamView}
        onSaveDeal={saveDealFromTeamView}
        access={access}
        canEditManagerNotes={canEditManagerNotes}
        onUnlockManagerNotes={unlockManagerNotes}
        onLockManagerNotes={lockManagerNotes}
      />
    ),
    "Team Performance": <TeamPerformancePage data={scopedData} selectedYear={selectedYear} selectedHalfYear={selectedHalfYear} />,
    "Individual Performance": (
      <IndividualPerformancePage data={scopedData} selectedYear={selectedYear} selectedHalfYear={selectedHalfYear} />
    ),
    Summary: (
      <SummaryPage
        data={scopedData}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedPeriodType={selectedPeriodType}
        selectedQuarter={selectedQuarter}
        selectedHalfYear={selectedHalfYear}
      />
    )
  };

  if (!authChecked) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-bold text-slate-600">Loading MIDAS Sales Forecast...</div>;
  }

  if (!authenticated) {
    return <PasswordGate onLogin={refreshData} externalError={appError} />;
  }

  if (!dataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="panel max-w-lg p-5 text-sm font-bold text-slate-600">
          {appError ? <div className="mb-3 rounded-md bg-red-50 px-4 py-3 text-red-700">{appError}</div> : null}
          Loading data from Google Sheets...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedPeriodType={selectedPeriodType}
          setSelectedPeriodType={setSelectedPeriodType}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedQuarter={selectedQuarter}
          setSelectedQuarter={setSelectedQuarter}
          selectedHalfYear={selectedHalfYear}
          setSelectedHalfYear={setSelectedHalfYear}
          preparedBy={data.preparedBy}
          setPreparedBy={setPreparedBy}
          lastUpdated={data.lastUpdated}
          onExportCsv={exportCsv}
          onImportCsv={importCsv}
          onExportJson={exportJson}
          onImportJson={importJson}
          onBackup={createServerBackup}
          onRefresh={manualRefreshData}
          refreshing={refreshingSheets}
          connectionStatus={sheetsConnection}
          connectionMessage={connectionMessage}
          onReconnect={reconnectGoogleSheets}
          onFullSignIn={reconnectGoogleIdentity}
          reconnecting={reconnectingSheets}
          isManager={isManager}
          access={access}
          availableTabs={availableTabs}
          rates={ratesFromSettings(data.settings, data.teams)}
          onSaveRates={saveRates}
        />
        {appError ? <div className="mx-4 mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700 lg:mx-6">{appError}</div> : null}
        <main className="p-4 lg:p-6">{content[activeTab]}</main>
        {importJob ? (
          <ImportPreviewModal
            type={importJob.type}
            preview={importJob.preview}
            importing={importing}
            onCancel={() => setImportJob(null)}
            onConfirm={confirmCsvImport}
          />
        ) : null}
      </div>
    </div>
  );
}
