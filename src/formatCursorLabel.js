import * as d3 from 'd3';

const formatK = (value) => {
  const k = value / 1000;
  return Number.isInteger(k) ? String(k) : d3.format('.2f')(k);
};

/** Single source — one row, e.g. solar in 2023: 13kTWh */
export const buildCursorLabelShort = (year, value, source) => ({
  rows: [{ source, rest: ` in ${year}: ${formatK(value)}kTWh` }],
});

/** All sources — year header + one row per source */
export const buildCursorLabelMulti = (year, values, sources) => ({
  header: `Year ${year}`,
  rows: sources.map((source, i) => ({
    source,
    rest: `: ${formatK(values[i])}kTWh`,
  })),
});
