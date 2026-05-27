import * as d3 from 'd3';

/** Matches axis ticks: raw value ÷ 1000 → e.g. "(2023, 13kTWh)". */
export const formatCursorLabel = (year, value) => {
  const k = value / 1000;
  const kStr = Number.isInteger(k) ? String(k) : d3.format('.2f')(k);
  return `(${year}, ${kStr}kTWh)`;
};
