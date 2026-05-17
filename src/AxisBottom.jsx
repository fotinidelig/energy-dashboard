import { fontSize } from './theme/typography.js'

const PRIMARY_TICK_LENGTH = 8;
const SECONDARY_TICK_LENGTH = 4;

function yearsInDomain(xScale, step = 5) {
  const [d0, d1] = xScale.domain();
  const start = Math.ceil(d0 / step) * step;
  const years = [];
  for (let y = start; y <= d1; y += step) {
    years.push(y);
  }
  return years;
}

const SECONDARY_COLOR = '#9ca3af';

export const AxisBottom = ({ xScale, innerHeight, label }) => {
  const range = xScale.range();
  const primaryYears = yearsInDomain(xScale, 10).filter((y) => y % 10 === 0);
  const secondaryYears = yearsInDomain(xScale, 2).filter(
    (y) => y % 10 !== 0,
  );

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
              fontSize: fontSize.axisInline-2,
              textAnchor: "middle",
              transform: "translateY(16px)",
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
