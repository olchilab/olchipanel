var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/scope/model.js
var model_exports = {};
__export(model_exports, {
  DEMO: () => DEMO,
  METRICS: () => METRICS,
  ROWS: () => ROWS,
  SNAPSHOT: () => SNAPSHOT,
  STORAGE: () => STORAGE,
  analysisStorage: () => analysisStorage,
  rangeIndices: () => rangeIndices,
  readStored: () => readStored,
  snapshot: () => snapshot,
  statistics: () => statistics
});
module.exports = __toCommonJS(model_exports);
var ROWS = Array.from({ length: 50 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 7, 1 + index)).toISOString().slice(0, 10);
  const dip = index >= 22 && index <= 29;
  const visitors = Math.round((1800 + index * 13 + Math.sin(index * 1.1) * 190 + (index % 7 < 2 ? 250 : 0)) * (dip ? 0.58 : 1));
  const revenue = Math.round(visitors * (28 + index % 5 * 3) * (dip ? 0.86 : 1) / 100) * 100;
  return { index, date, visitors, revenue };
});
var METRICS = {
  visitors: { label: "\uBC29\uBB38\uC790 \uC218", axis: "\uC77C\uBCC4 \uBC29\uBB38\uC790 \uC218 (\uBA85)", unit: "\uBA85" },
  revenue: { label: "\uB9E4\uCD9C", axis: "\uC77C\uBCC4 \uB9E4\uCD9C (\uC6D0)", unit: "\uC6D0" }
};
var DEMO = new URLSearchParams(globalThis.location?.search || "").get("demo") === "1";
var STORAGE = DEMO ? "olchipanel.championship.analysis.v1" : "olchipanel.analysis.v1";
var SNAPSHOT = DEMO ? "olchipanel.championship.analysis-result.v1" : "olchipanel.analysis-result.v1";
function analysisStorage() {
  return DEMO ? sessionStorage : localStorage;
}
function rangeIndices(start, end) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
  const a = ROWS.findIndex((row) => row.date === start), b = ROWS.findIndex((row) => row.date === end);
  return a < 0 || b < 0 ? null : { start: Math.min(a, b), end: Math.max(a, b) };
}
function statistics(metric, start = 0, end = ROWS.length - 1) {
  if (!METRICS[metric] || !Number.isInteger(start) || !Number.isInteger(end)) throw new Error("Invalid metric or date index");
  const lo = Math.max(0, Math.min(start, end)), hi = Math.min(ROWS.length - 1, Math.max(start, end));
  const rows = ROWS.filter((row) => row.index >= lo && row.index <= hi);
  if (!rows.length) return { count: 0, minimum: null, maximum: null, average: null, total: 0, rows };
  const minimum = rows.reduce((a, b) => a[metric] <= b[metric] ? a : b), maximum = rows.reduce((a, b) => a[metric] >= b[metric] ? a : b);
  const total = rows.reduce((sum, row) => sum + row[metric], 0);
  return { count: rows.length, minimum, maximum, average: total / rows.length, total, rows };
}
function readStored() {
  let value;
  try {
    value = JSON.parse(analysisStorage().getItem(STORAGE) || "null");
  } catch (_) {
  }
  const metric = METRICS[value?.metric] ? value.metric : "visitors";
  const range = value && rangeIndices(value.start, value.end);
  return { metric, range: range || { start: 0, end: 49 } };
}
function snapshot(metric, range) {
  const stats = statistics(metric, range.start, range.end);
  return {
    schema: "championship-analysis.v1",
    metric,
    start: stats.rows[0].date,
    end: stats.rows.at(-1).date,
    count: stats.count,
    minimum: stats.minimum[metric],
    maximum: stats.maximum[metric],
    average: Number(stats.average.toFixed(2)),
    total: stats.total
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEMO,
  METRICS,
  ROWS,
  SNAPSHOT,
  STORAGE,
  analysisStorage,
  rangeIndices,
  readStored,
  snapshot,
  statistics
});
