const TICK_LENGTH = 4;

export const AxisLeft = ({ yScale, pixelsPerTick, innerWidth, label }) => {
  const range = yScale.range();
  const height = range[0] - range[1];
  const numberOfTicksTarget = Math.floor(height / pixelsPerTick);

  return (
    <>
      <path
        d={["M", 0, range[0], "L", 0, range[1]].join(" ")}
        fill="none"
        stroke="black"
      />
      {yScale.ticks(numberOfTicksTarget).map((value) => (
        <g key={value} transform={`translate(0, ${yScale(value)})`} overflow={'visible'}>
          <line x1={0} x2={innerWidth} stroke="black" opacity={0.1} />
          <line x2={-TICK_LENGTH} stroke="black" />
          <text
            style={{
              fontSize: "9px",
              textAnchor: "middle",
              dominantBaseline: 'middle',
              transform: "translateX(-15px)",
              fill: 'black',
            }}
          >
            {value}
          </text>
        </g>
        
      ))}
      <g transform={`translate(0, ${range[1]}) rotate(-90)`}>
        <text
          style={{
            fontSize: "14px",
            textAnchor: "end",
            transform: "translateY(-35px)",
          }}
          fill='black'
        >
          {label}
        </text>
      </g>
    </>
  );
};