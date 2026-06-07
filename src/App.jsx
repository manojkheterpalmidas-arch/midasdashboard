import React, { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
const CURRENCIES = ["GBP", "EUR", "PLN", "USD"];
const CHART_COLORS = ["#16825d", "#1d4f8f", "#d18b16", "#c24136", "#6d5bd0"];
const RADIAN = Math.PI / 180;
const TABS = ["Dashboard", "Teams", "Deals", "Monthly Goals", "Team View", "Summary"];
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
  "comments",
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
    preparedBy: "Sales Manager",
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
        comments: record.comments,
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
    preparedBy: meta.preparedBy || "Sales Manager",
    lastUpdated: new Date().toISOString()
  };
}

function emptyData() {
  return {
    teams: [],
    deals: [],
    goals: [],
    settings: {},
    preparedBy: "Sales Manager",
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
          {formatCompactMoney(value, currency)}
        </tspan>
      </text>
    );
  };
}

function formatPercent(value) {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  return `${Math.round(value * 100)}%`;
}

function normalizeDeal(deal) {
  const next = {
    ...deal,
    year: num(deal.year),
    month: num(deal.month),
    minAmount: num(deal.minAmount),
    maxAmount: num(deal.maxAmount),
    probability: num(deal.probability)
  };
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

function dealClosedAmount(deal) {
  return num(deal.closedAmount) || num(deal.maxAmount);
}

function amountForView(amount, team, useKrw) {
  return useKrw ? toKrw(amount, team) : num(amount);
}

function matchesScope(item, scope) {
  if (scope.year && num(item.year) !== num(scope.year)) return false;
  if (scope.month && num(item.month) !== num(scope.month)) return false;
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

function TopNav({ activeTab, setActiveTab }) {
  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto border-t border-midas-line pt-3">
      {TABS.map((tab) => (
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
  selectedMonth,
  setSelectedMonth,
  preparedBy,
  setPreparedBy,
  lastUpdated,
  onExportCsv,
  onImportCsv,
  onExportJson,
  onImportJson,
  onBackup
}) {
  const teamsCsvRef = useRef(null);
  const dealsCsvRef = useRef(null);
  const goalsCsvRef = useRef(null);
  const jsonRef = useRef(null);

  return (
    <header className="border-b border-midas-line bg-slate-50 px-4 py-4 lg:px-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(360px,0.95fr)_minmax(280px,0.62fr)_minmax(430px,1.05fr)]">
        <div className="panel flex min-h-44 flex-col justify-between overflow-hidden border-l-4 border-l-midas-navy p-5">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-midas-blue">
              MIDAS Internal
            </div>
            <h1 className="text-3xl font-extrabold text-midas-ink">MIDAS IT Europe Sales Forecast</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Last updated {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Not saved yet"}
            </p>
          </div>
          <button className="btn-danger mt-5 w-full sm:w-72" onClick={onBackup}>
            Download JSON Backup
          </button>
        </div>

        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Forecast Scope</h2>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">Live Sheets</span>
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
              <label className="label">Month</label>
              <select className="field" value={selectedMonth} onChange={(e) => setSelectedMonth(num(e.target.value))}>
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Prepared by</label>
              <input className="field" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} />
            </div>
          </div>
        </div>

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
      </div>
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </header>
  );
}

function KpiCard({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-l-midas-navy",
    green: "border-l-midas-green",
    amber: "border-l-midas-amber",
    red: "border-l-midas-red",
    blue: "border-l-midas-blue"
  };
  return (
    <div className={`panel border-l-4 ${tones[tone]} p-4`}>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-midas-ink">{value}</div>
      {helper ? <div className="mt-1 text-sm text-slate-500">{helper}</div> : null}
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
              <th key={column.header} className="px-3 py-3">
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

function PasswordGate({ onLogin }) {
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

  function useRedirect() {
    try {
      api.redirectLogin();
    } catch (redirectError) {
      setError(redirectError.message || "Redirect sign-in failed.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="panel w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-midas-ink">MIDAS Sales Forecast</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with a Google account that has access to the forecast spreadsheet.</p>
        {error ? <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div> : null}
        {hint ? <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{hint}</div> : null}
        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Waiting for Google..." : "Sign in with Google"}
        </button>
        <button type="button" className="btn-secondary mt-2 w-full" onClick={useRedirect}>
          Sign in with redirect
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
          {importing ? "Importing..." : "Confirm Import"}
        </button>
      </div>
    </Modal>
  );
}

function FormActions({ onCancel, submitLabel }) {
  return (
    <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-midas-line pt-4">
      <button type="button" className="btn-secondary" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="btn-primary">
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
      krwRate: 1850,
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
      krwRate: num(form.krwRate),
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
        </div>
        <div>
          <label className="label">KRW rate</label>
          <input
            required
            type="number"
            min="0"
            className="field"
            value={form.krwRate}
            onChange={(e) => update("krwRate", e.target.value)}
          />
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

function DealForm({ teams, initialDeal, selectedYear, selectedMonth, onSave, onCancel }) {
  const firstTeam = teams[0];
  const [form, setForm] = useState(
    initialDeal || {
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
      comments: "",
      nextAction: ""
    }
  );
  const selectedTeam = getTeam(teams, form.teamId);

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "teamId") {
        next.repName = getTeam(teams, value)?.reps?.[0] || "";
      }
      return next;
    });
  }

  function submit(event) {
    event.preventDefault();
    onSave(normalizeDeal({ ...form, id: form.id || createId("deal") }));
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
          <label className="label">Min amount</label>
          <input type="number" min="0" className="field" value={form.minAmount} onChange={(e) => update("minAmount", e.target.value)} />
        </div>
        <div>
          <label className="label">Max amount</label>
          <input type="number" min="0" className="field" value={form.maxAmount} onChange={(e) => update("maxAmount", e.target.value)} />
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
          <label className="label">Closed amount</label>
          <input
            type="number"
            min="0"
            className="field"
            value={form.closedAmount}
            onChange={(e) => update("closedAmount", e.target.value)}
            placeholder="Uses max amount if closed"
          />
        </div>
        <div>
          <label className="label">Expected close date</label>
          <input type="date" className="field" value={form.expectedCloseDate} onChange={(e) => update("expectedCloseDate", e.target.value)} />
        </div>
        <div className="md:col-span-3">
          <label className="label">Comments</label>
          <textarea className="field min-h-20" value={form.comments} onChange={(e) => update("comments", e.target.value)} />
        </div>
        <div className="md:col-span-3">
          <label className="label">Next action</label>
          <textarea className="field min-h-20" value={form.nextAction} onChange={(e) => update("nextAction", e.target.value)} />
        </div>
      </div>
      <FormActions onCancel={onCancel} submitLabel={initialDeal ? "Save deal" : "Add deal"} />
    </form>
  );
}

function GoalForm({ teams, initialGoal, selectedYear, selectedMonth, goalType, onSave, onCancel }) {
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
  const selectedTeam = getTeam(teams, form.teamId);

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "teamId") next.repName = getTeam(teams, value)?.reps?.[0] || "";
      return next;
    });
  }

  function submit(event) {
    event.preventDefault();
    onSave(normalizeGoal({ ...form, id: form.id || createId("goal") }));
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
          <label className="label">Target amount</label>
          <input
            type="number"
            min="0"
            className="field"
            value={form.targetAmount}
            onChange={(e) => update("targetAmount", e.target.value)}
          />
        </div>
      </div>
      <FormActions onCancel={onCancel} submitLabel={initialGoal ? "Save goal" : "Add goal"} />
    </form>
  );
}

function BulkGoalForm({ teams, selectedYear, goalType, onSave, onCancel }) {
  const firstTeam = teams[0];
  const [teamId, setTeamId] = useState(firstTeam?.id || "");
  const [repName, setRepName] = useState(firstTeam?.reps?.[0] || "");
  const [year, setYear] = useState(selectedYear);
  const [type, setType] = useState(goalType);
  const [grid, setGrid] = useState({});
  const team = getTeam(teams, teamId);

  function setAmount(month, category, value) {
    setGrid((current) => ({ ...current, [`${month}-${category}`]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const rows = [];
    for (let month = 1; month <= 12; month += 1) {
      CATEGORIES.forEach((category) => {
        rows.push({
          id: createId("goal"),
          teamId,
          repName,
          year: num(year),
          month,
          category,
          goalType: type,
          targetAmount: num(grid[`${month}-${category}`])
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
          <label className="label">Goal type</label>
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
            {GOAL_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="table-head">
              <th className="px-3 py-3">Month</th>
              {CATEGORIES.map((category) => (
                <th key={category} className="px-3 py-3">
                  {category}
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
                      className="field min-w-32"
                      value={grid[`${index + 1}-${category}`] || ""}
                      onChange={(e) => setAmount(index + 1, category, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FormActions onCancel={onCancel} submitLabel="Save monthly goals" />
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

function Dashboard({ data, selectedYear, selectedMonth }) {
  const [goalType, setGoalType] = useState("Responsibility Goal");
  const { teams, deals, goals } = data;
  const metrics = calculateMetrics({
    teams,
    deals,
    goals,
    goalType,
    useKrw: true,
    scope: { year: selectedYear, month: selectedMonth }
  });

  const teamRows = teams.map((team) => {
    const itemMetrics = calculateMetrics({
      teams,
      deals,
      goals,
      goalType,
      useKrw: true,
      scope: { year: selectedYear, month: selectedMonth, teamId: team.id }
    });
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
    const categoryMetrics = calculateMetrics({
      teams,
      deals,
      goals,
      goalType,
      useKrw: true,
      scope: { year: selectedYear, month: selectedMonth, category }
    });
    return {
      category,
      "Min Forecast": categoryMetrics.min,
      "Max Upside": Math.max(categoryMetrics.max - categoryMetrics.min, 0)
    };
  });

  const coveragePie = [
    { name: "Closed", value: metrics.closed },
    { name: "Open Min", value: metrics.min },
    { name: "Upside", value: Math.max(metrics.max - metrics.min, 0) },
    { name: "Remaining to Target", value: Math.max(metrics.target - metrics.achievementMax, 0) }
  ].filter((item) => item.value > 0);

  const kpis = [
    ["Total Target", metrics.target, "navy"],
    ["Closed Achievement", metrics.closed, "green"],
    ["Min Forecast", metrics.min, "blue"],
    ["Max Forecast", metrics.max, "blue"],
    ["Achievement + Min Forecast", metrics.achievementMin, metrics.gapMin >= 0 ? "green" : "amber"],
    ["Achievement + Max Forecast", metrics.achievementMax, metrics.gapMax >= 0 ? "green" : "amber"],
    ["Gap Using Min", metrics.gapMin, metrics.gapMin >= 0 ? "green" : "red"],
    ["Gap Using Max", metrics.gapMax, metrics.gapMax >= 0 ? "green" : "red"],
    ["Min Coverage %", metrics.minCoverage, metrics.minCoverage >= 1 ? "green" : "amber", true],
    ["Max Coverage %", metrics.maxCoverage, metrics.maxCoverage >= 1 ? "green" : "amber", true]
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="section-title">Dashboard</h2>
          <p className="text-sm text-slate-500">
            Management view for {monthName(selectedMonth)} {selectedYear}, shown in KRW.
          </p>
        </div>
        <div className="w-full md:w-64">
          <label className="label">Goal type</label>
          <select className="field" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
            {GOAL_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(([label, value, tone, isPercent]) => (
          <KpiCard key={label} label={label} value={isPercent ? formatPercent(value) : formatMoney(value, "KRW")} tone={tone} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Target vs Achievement Forecast by Team">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
              <Tooltip formatter={(value) => formatMoney(value, "KRW")} />
              <Legend />
              <Bar dataKey="Target" fill="#0f2742" />
              <Bar dataKey="Achievement + Min" fill="#16825d" />
              <Bar dataKey="Achievement + Max" fill="#1d4f8f" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Overall Coverage">
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
                label={makePieLabel("KRW")}
              >
                {coveragePie.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value, "KRW")} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Forecast by Category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
              <Tooltip formatter={(value) => formatMoney(value, "KRW")} />
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
              { header: "Target", render: (row) => formatMoney(row.target, "KRW") },
              { header: "Achievement + Min", render: (row) => formatMoney(row.achievementMin, "KRW") },
              { header: "Achievement + Max", render: (row) => formatMoney(row.achievementMax, "KRW") },
              { header: "Coverage", render: (row) => formatPercent(row.maxCoverage) },
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
    if (data.teams.some((item) => item.id === team.id)) await api.updateTeam(team.id, team);
    else await api.createTeam(team);
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
          <p className="text-sm text-slate-500">Manage team setup, currencies, KRW rates, and reps.</p>
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
            { header: "KRW rate", render: (row) => num(row.krwRate).toLocaleString() },
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

function DealsPage({ data, refreshData, selectedYear, selectedMonth }) {
  const [editing, setEditing] = useState(null);
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
    if (data.deals.some((item) => item.id === deal.id)) await api.updateDeal(deal.id, deal);
    else await api.createDeal(deal);
    await refreshData();
    setEditing(null);
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
        <button className="btn-primary" onClick={() => setEditing({})}>
          Add Deal
        </button>
      </div>
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
            { header: "Company", render: (row) => row.companyName },
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
            { header: "Comments", render: (row) => row.comments },
            { header: "Next Action", render: (row) => row.nextAction },
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
                <button className="btn-danger" onClick={() => deleteDeal(row.id)}>
                  Delete
                </button>
              )
            }
          ]}
        />
      </div>
      {editing ? (
        <Modal title={editing.id ? "Edit Deal" : "Add Deal"} onClose={() => setEditing(null)}>
          <DealForm
            teams={data.teams}
            initialDeal={editing.id ? editing : null}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSave={saveDeal}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function GoalsPage({ data, refreshData, selectedYear, selectedMonth }) {
  const [goalType, setGoalType] = useState("Responsibility Goal");
  const [year, setYear] = useState(selectedYear);
  const [editing, setEditing] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  async function saveGoal(goal) {
    if (data.goals.some((item) => item.id === goal.id)) await api.updateGoal(goal.id, goal);
    else await api.createGoal(goal);
    await refreshData();
    setEditing(null);
  }

  async function saveBulk(rows) {
    await Promise.all(rows.map((goal) => api.createGoal(goal)));
    await refreshData();
    setBulkOpen(false);
  }

  async function deleteGoal(goalId) {
    if (!confirm("Delete this monthly goal?")) return;
    await api.deleteGoal(goalId);
    await refreshData();
  }

  const rows = data.goals.filter((goal) => num(goal.year) === num(year) && goal.goalType === goalType);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Monthly Goals</h2>
          <p className="text-sm text-slate-500">Official targets by team, rep, month, category, and goal type.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setBulkOpen(true)}>
            Bulk create monthly goals
          </button>
          <button className="btn-primary" onClick={() => setEditing({})}>
            Add Goal
          </button>
        </div>
      </div>
      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-2">
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
            <select className="field" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              {GOAL_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
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
            { header: "Target Amount", render: (row) => formatMoney(row.targetAmount, getTeam(data.teams, row.teamId)?.currency) },
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
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            goalType={goalType}
            onSave={saveGoal}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      ) : null}
      {bulkOpen ? (
        <Modal title="Bulk Create Monthly Goals" onClose={() => setBulkOpen(false)}>
          <BulkGoalForm
            teams={data.teams}
            selectedYear={selectedYear}
            goalType={goalType}
            onSave={saveBulk}
            onCancel={() => setBulkOpen(false)}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function ForecastTable({ title, deals, team, currency }) {
  const totalMin = deals.reduce((sum, deal) => sum + num(deal.minAmount), 0);
  const totalMax = deals.reduce((sum, deal) => sum + num(deal.maxAmount), 0);
  return (
    <div className="panel">
      <div className="border-b border-midas-line px-4 py-3">
        <h3 className="font-bold text-midas-ink">{title}</h3>
      </div>
      <DataTable
        rows={deals}
        columns={[
          { header: "Company", render: (row) => row.companyName },
          { header: "Product", render: (row) => row.product },
          { header: "Rep", render: (row) => row.repName },
          { header: "Min Amount", render: (row) => formatMoney(row.minAmount, currency) },
          { header: "Max Amount", render: (row) => formatMoney(row.maxAmount, currency) },
          { header: "Probability", render: (row) => `${row.probability}%` },
          { header: "Temperature", render: (row) => <Badge tone={temperatureTone(row.temperature)}>{row.temperature}</Badge> },
          { header: "Comments", render: (row) => row.comments },
          { header: "Next Action", render: (row) => row.nextAction }
        ]}
      />
      <div className="grid gap-3 border-t border-midas-line bg-slate-50 p-4 text-sm font-bold md:grid-cols-4">
        <div>Total Min: {formatMoney(totalMin, currency)}</div>
        <div>Total Max: {formatMoney(totalMax, currency)}</div>
        <div>Total Min KRW: {formatMoney(toKrw(totalMin, team), "KRW")}</div>
        <div>Total Max KRW: {formatMoney(toKrw(totalMax, team), "KRW")}</div>
      </div>
    </div>
  );
}

function TeamView({ data, selectedYear, selectedMonth }) {
  const [teamId, setTeamId] = useState(data.teams[0]?.id || "");
  const [year, setYear] = useState(selectedYear);
  const [month, setMonth] = useState(selectedMonth);
  const [goalType, setGoalType] = useState("Responsibility Goal");
  const [repName, setRepName] = useState("All reps");
  const team = getTeam(data.teams, teamId) || data.teams[0];
  const currency = team?.currency || "GBP";
  const scope = { year, month, teamId: team?.id, repName };
  const metrics = calculateMetrics({ teams: data.teams, deals: data.deals, goals: data.goals, goalType, useKrw: false, scope });
  const openDeals = data.deals.filter((deal) => deal.status === "Open" && matchesScope(deal, scope));

  const categoryRows = CATEGORIES.map((category) => {
    const categoryMetrics = calculateMetrics({
      teams: data.teams,
      deals: data.deals,
      goals: data.goals,
      goalType,
      useKrw: false,
      scope: { ...scope, category }
    });
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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title">Team View</h2>
        <p className="text-sm text-slate-500">Team-level working view in local currency.</p>
      </div>
      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-5">
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
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Target" value={formatMoney(metrics.target, currency)} />
        <KpiCard label="Closed Achievement" value={formatMoney(metrics.closed, currency)} tone="green" />
        <KpiCard label="Min Forecast" value={formatMoney(metrics.min, currency)} tone="blue" />
        <KpiCard label="Max Forecast" value={formatMoney(metrics.max, currency)} tone="blue" />
        <KpiCard label="Achievement + Min" value={formatMoney(metrics.achievementMin, currency)} tone={metrics.gapMin >= 0 ? "green" : "amber"} />
        <KpiCard label="Achievement + Max" value={formatMoney(metrics.achievementMax, currency)} tone={metrics.gapMax >= 0 ? "green" : "amber"} />
        <KpiCard label="Gap Using Min" value={formatMoney(metrics.gapMin, currency)} tone={metrics.gapMin >= 0 ? "green" : "red"} />
        <KpiCard label="Gap Using Max" value={formatMoney(metrics.gapMax, currency)} tone={metrics.gapMax >= 0 ? "green" : "red"} />
        <KpiCard label="Coverage %" value={formatPercent(metrics.maxCoverage)} tone={metrics.maxCoverage >= 1 ? "green" : "amber"} />
      </div>
      {CATEGORIES.map((category) => (
        <ForecastTable
          key={category}
          title={`${category} Deals`}
          team={team}
          currency={currency}
          deals={openDeals.filter((deal) => deal.category === category)}
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
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartPanel title="Achievement + Max Forecast vs Target">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={coveragePie} dataKey="value" nameKey="name" outerRadius={90} label>
                {coveragePie.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value, currency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Category Target vs Forecast">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={targetForecastChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => formatMoney(value, currency)} />
              <Legend />
              <Bar dataKey="Target" fill="#0f2742" />
              <Bar dataKey="Achievement + Max" fill="#16825d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Forecast Split">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={splitPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} label>
                {splitPie.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value, currency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  );
}

function SummaryPage({ data, selectedYear, selectedMonth }) {
  const [year, setYear] = useState(selectedYear);
  const [month, setMonth] = useState(selectedMonth);
  const [goalType, setGoalType] = useState("Responsibility Goal");
  const [currencyView, setCurrencyView] = useState("KRW");
  const useKrw = currencyView === "KRW";
  const summaryCurrency = useKrw ? "KRW" : "GBP";
  const metrics = calculateMetrics({
    teams: data.teams,
    deals: data.deals,
    goals: data.goals,
    goalType,
    useKrw,
    scope: { year, month }
  });

  const teamRows = data.teams.map((team) => {
    const itemMetrics = calculateMetrics({
      teams: data.teams,
      deals: data.deals,
      goals: data.goals,
      goalType,
      useKrw,
      scope: { year, month, teamId: team.id }
    });
    return { id: team.id, team, ...itemMetrics, status: riskFor(itemMetrics) };
  });

  const categoryRows = CATEGORIES.map((category) => {
    const itemMetrics = calculateMetrics({
      teams: data.teams,
      deals: data.deals,
      goals: data.goals,
      goalType,
      useKrw,
      scope: { year, month, category }
    });
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
    if (useKrw) return formatMoney(value, "KRW");
    return formatMoney(value, team?.currency || summaryCurrency);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title">Summary</h2>
        <p className="text-sm text-slate-500">Combined manager view. KRW is recommended for cross-team totals.</p>
      </div>
      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-4">
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
            <label className="label">Goal type</label>
            <select className="field" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              {GOAL_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Currency view</label>
            <select className="field" value={currencyView} onChange={(e) => setCurrencyView(e.target.value)}>
              <option>KRW</option>
              <option>Local</option>
            </select>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={`Total Target ${currencyView}`} value={money(metrics.target)} />
        <KpiCard label={`Closed Achievement ${currencyView}`} value={money(metrics.closed)} tone="green" />
        <KpiCard label={`Min Forecast ${currencyView}`} value={money(metrics.min)} tone="blue" />
        <KpiCard label={`Max Forecast ${currencyView}`} value={money(metrics.max)} tone="blue" />
        <KpiCard label={`Achievement + Min ${currencyView}`} value={money(metrics.achievementMin)} tone={metrics.gapMin >= 0 ? "green" : "amber"} />
        <KpiCard label={`Achievement + Max ${currencyView}`} value={money(metrics.achievementMax)} tone={metrics.gapMax >= 0 ? "green" : "amber"} />
        <KpiCard label={`Gap Using Min ${currencyView}`} value={money(metrics.gapMin)} tone={metrics.gapMin >= 0 ? "green" : "red"} />
        <KpiCard label={`Gap Using Max ${currencyView}`} value={money(metrics.gapMax)} tone={metrics.gapMax >= 0 ? "green" : "red"} />
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
            { header: `Target ${currencyView}`, render: (row) => money(row.target, row.team) },
            { header: `Closed Achievement ${currencyView}`, render: (row) => money(row.closed, row.team) },
            { header: `Min Forecast ${currencyView}`, render: (row) => money(row.min, row.team) },
            { header: `Max Forecast ${currencyView}`, render: (row) => money(row.max, row.team) },
            { header: `Achievement + Min ${currencyView}`, render: (row) => money(row.achievementMin, row.team) },
            { header: `Achievement + Max ${currencyView}`, render: (row) => money(row.achievementMax, row.team) },
            { header: `Gap Using Min ${currencyView}`, render: (row) => money(row.gapMin, row.team) },
            { header: `Gap Using Max ${currencyView}`, render: (row) => money(row.gapMax, row.team) },
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
            { header: `Target ${currencyView}`, render: (row) => money(row.target) },
            { header: `Closed Achievement ${currencyView}`, render: (row) => money(row.closed) },
            { header: `Min Forecast ${currencyView}`, render: (row) => money(row.min) },
            { header: `Max Forecast ${currencyView}`, render: (row) => money(row.max) },
            { header: `Achievement + Min ${currencyView}`, render: (row) => money(row.achievementMin) },
            { header: `Achievement + Max ${currencyView}`, render: (row) => money(row.achievementMax) },
            { header: `Gap Using Min ${currencyView}`, render: (row) => money(row.gapMin) },
            { header: `Gap Using Max ${currencyView}`, render: (row) => money(row.gapMax) },
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
              <YAxis tickFormatter={(value) => (useKrw ? `${Math.round(value / 1000000)}M` : value)} />
              <Tooltip formatter={(value) => (useKrw ? formatMoney(value, "KRW") : value.toLocaleString())} />
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
              <YAxis tickFormatter={(value) => (useKrw ? `${Math.round(value / 1000000)}M` : value)} />
              <Tooltip formatter={(value) => (useKrw ? formatMoney(value, "KRW") : value.toLocaleString())} />
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
                label={makePieLabel(useKrw ? "KRW" : "GBP")}
              >
                {coveragePie.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => (useKrw ? formatMoney(value, "KRW") : value.toLocaleString())} />
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
                label={makePieLabel(useKrw ? "KRW" : "GBP")}
              >
                {forecastPie.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => (useKrw ? formatMoney(value, "KRW") : value.toLocaleString())} />
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
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [appError, setAppError] = useState("");
  const [importJob, setImportJob] = useState(null);
  const [importing, setImporting] = useState(false);

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
        await refreshData();
      } catch (error) {
        setAppError(error.message || "Could not connect to the local server.");
      } finally {
        setAuthChecked(true);
      }
    }
    boot();
  }, []);

  async function refreshData() {
    try {
      const nextData = await api.readAllData();
      setData((current) => ({
        ...current,
        teams: nextData.teams,
        deals: nextData.deals,
        goals: nextData.goals,
        settings: nextData.settings,
        preparedBy: nextData.settings?.preparedBy || current.preparedBy,
        lastUpdated: new Date().toISOString()
      }));
      setAuthenticated(true);
      setAppError("");
    } catch (error) {
      if (error.status === 401) {
        sessionStorage.removeItem("midas-authenticated");
        setAuthenticated(false);
      } else {
        setAppError(error.message || "Could not load backend data.");
      }
    }
  }

  function setPreparedBy(preparedBy) {
    setData((current) => ({ ...current, preparedBy }));
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

  const content = {
    Dashboard: <Dashboard data={data} selectedYear={selectedYear} selectedMonth={selectedMonth} />,
    Teams: <TeamsPage data={data} refreshData={refreshData} />,
    Deals: <DealsPage data={data} refreshData={refreshData} selectedYear={selectedYear} selectedMonth={selectedMonth} />,
    "Monthly Goals": <GoalsPage data={data} refreshData={refreshData} selectedYear={selectedYear} selectedMonth={selectedMonth} />,
    "Team View": <TeamView data={data} selectedYear={selectedYear} selectedMonth={selectedMonth} />,
    Summary: <SummaryPage data={data} selectedYear={selectedYear} selectedMonth={selectedMonth} />
  };

  if (!authChecked) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-bold text-slate-600">Loading MIDAS Sales Forecast...</div>;
  }

  if (!authenticated) {
    return <PasswordGate onLogin={refreshData} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          preparedBy={data.preparedBy}
          setPreparedBy={setPreparedBy}
          lastUpdated={data.lastUpdated}
          onExportCsv={exportCsv}
          onImportCsv={importCsv}
          onExportJson={exportJson}
          onImportJson={importJson}
          onBackup={createServerBackup}
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
