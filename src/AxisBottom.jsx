const TICK_LENGTH = 4;

export const AxisBottom = ({ xScale, pixelsPerTick, innerHeight, label }) => {
  const range = xScale.range();
  const width = range[1] - range[0];
  const numberOfTicksTarget = Math.floor(width / pixelsPerTick);

  return (
    <>
      <line
        x1={range[0]} y1={0} x2={range[1]} y2={0}
        stroke="black" fill="none"
      />
      {xScale.ticks(numberOfTicksTarget).map((value) => (
        <g key={value} transform={`translate(${xScale(value)}, 0)`}>
          <line y1={0} y2={-innerHeight} stroke="black" opacity={0.1} />
          <line y2={TICK_LENGTH} stroke="black" />
          <text
            style={{
              fontSize: "9px",
              textAnchor: "middle",
              transform: "translateY(20px)",
              fill: 'black',
            }}
          >
            {value}
          </text>
        </g>
      ))}
      <g transform={`translate(${range[1]}, 0)`}>
        <text
          style={{
            fontSize: "14px",
            textAnchor: "end",
            transform: "translateY(40px)",
          }}
          fill='black'
        >
          {label}
        </text>
      </g>
    </>
  );
};