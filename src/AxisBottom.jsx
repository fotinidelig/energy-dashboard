import * as d3 from 'd3'
import { fontSize } from './theme/typography.js'

const PRIMARY_TICK_LENGTH = 8;
const SECONDARY_TICK_LENGTH = 4;
const MINOR_SUBDIVISIONS = 4;

function yearsInDomain(xScale, step) {
  const [d0, d1] = xScale.domain();
  const start = Math.ceil(d0 / step) * step;
  const years = [];
  for (let y = start; y <= d1; y += step) {
    years.push(y);
  }
  return years;
}

const SECONDARY_COLOR = '#9ca3af';

export const AxisBottom = ({ xScale, pixelsPerTick, innerHeight, label }) => {
  const range = xScale.range();
  const width = range[1] - range[0];
  const numberOfTicksTarget = Math.max(2, Math.floor(width / pixelsPerTick));

  const [d0, d1] = xScale.domain();
  const majorStep = d3.tickStep(d0, d1, numberOfTicksTarget);
  const minorStep =
    majorStep > 1 ? d3.tickStep(0, majorStep, MINOR_SUBDIVISIONS) : null;

  const primaryYears = yearsInDomain(xScale, majorStep);
  const primarySet = new Set(primaryYears);
  const secondaryYears =
    minorStep != null && minorStep < majorStep
      ? yearsInDomain(xScale, minorStep).filter((y) => !primarySet.has(y))
      : [];

  return (
    <>
      {/* <line
        x1={range[0]}
        y1={0}
        x2={range[1]}
        y2={0}
        stroke="black"
        fill="none"
      /> */}
      {secondaryYears.map((year) => (
        <g key={`minor-${year}`} transform={`translate(${xScale(year)}, 0)`}>
          <line y2={SECONDARY_TICK_LENGTH} stroke={SECONDARY_COLOR} />
          <text
            style={{
              fontSize: fontSize.axisInline - 2,
              textAnchor: "middle",
              transform: "translateY(12px)",
              fill: SECONDARY_COLOR,
            }}
          >
            {String(year).slice(-2)}
          </text>
        </g>
      ))}
      {primaryYears.map((year) => (
        <g key={`major-${year}`} transform={`translate(${xScale(year)}, 0)`}>
          <line y1={0} y2={-innerHeight} stroke="#e5e7eb" />
          <line y2={PRIMARY_TICK_LENGTH} stroke="black" />
          <text
            style={{
              fontSize: fontSize.axisInline,
              textAnchor: "middle",
              transform: "translateY(22px)",
              fill: "black",
              fontWeight: 500,
            }}
          >
            {year}
          </text>
        </g>
      ))}
      <g transform={`translate(${range[1]}, 0)`}>
        <text
          style={{
            fontSize: fontSize.label,
            textAnchor: "end",
            transform: "translateY(40px)",
          }}
          fill="black"
        >
          {label}
        </text>
      </g>
    </>
  );
};
