import { useMemo, useRef, useState } from "react";
import * as d3 from 'd3';
import { useDimensions } from './use-dimensions'
import { muteColor } from './muteColor.js'
import { ChartTitle } from './ChartTitle.jsx'
import { fontSize } from './theme/typography.js'

export const DonutPlot = ({ width, height, data, year, sourceGlobal, sourceColors}) => {

    const inflexionPadding = 10;

    const outerRadius = Math.min(width, height) / 2 - 30;
    const innerRadius = outerRadius * 0.5;
    const centerX = width / 2;
    const centerY = height / 2;

    const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
    const percentages = data.map((d) => d.value / total);

    const [hoveredIndex, setHoveredIndex] = useState(null);

    const sourceMutedColors = useMemo(
      () => (sourceColors ? muteColor(sourceColors) : undefined),
      [sourceColors],
    );

    const pie = useMemo(() => {
      const rows = Array.isArray(data) ? data : []
      const pieGenerator = d3.pie().value((d) => d.value)
      return pieGenerator(rows)
    }, [data])

    const arcPathGenerator = d3.arc();
    const arcs = useMemo(() => {
        return pie.map((p) =>
        arcPathGenerator({
            innerRadius: innerRadius,
            outerRadius: outerRadius,
            startAngle: p.startAngle,
            endAngle: p.endAngle,
        })
        );
    }, [innerRadius, outerRadius, pie]);

  return (
    <svg width={width} height={height} style={{ display: "inline-block" }}>
      <ChartTitle width={width}>Yearly energy mix</ChartTitle>
      <g transform={`translate(${centerX}, ${centerY})`}>
        {arcs.map((arc, i) => {
            const slice = pie[i]

            const source = slice?.data?.source
            const sliceInfo = {
                innerRadius,
                outerRadius: outerRadius,
                startAngle: slice.startAngle,
                endAngle: slice.endAngle,
            };

            const centroid = arcPathGenerator.centroid(sliceInfo);
            const inflexionInfo = {
                innerRadius: outerRadius + inflexionPadding,
                outerRadius: outerRadius + inflexionPadding,
                startAngle: slice.startAngle,
                endAngle: slice.endAngle,
            };

            const inflexionPoint = arcPathGenerator.centroid(inflexionInfo);
            const isRightLabel = inflexionPoint[0] > 0;
            const labelPosX = inflexionPoint[0] + 10 * (isRightLabel ? 1 : -1);
            const textAnchor = isRightLabel ? "start" : "end";
            const label =
              source +
              " (" +
              (percentages[i] * 100).toFixed(1) +
              "%)";

            const showCallout = hoveredIndex === i && slice.value > 0;

            const vivid = source ? sourceColors?.[source] : undefined;
            const muted = source ? sourceMutedColors?.[source] : undefined;
            const isGlobal = source === sourceGlobal;
            let arcFill;
            if (sourceGlobal === source) {
              // If sourceGlobal is set, only this source should be vivid, all others muted.
              arcFill = isGlobal ? vivid ?? '#ccc' : muted ?? '#ccc';
            } else {
              arcFill =
                vivid == null
                  ? '#ccc'
                  : hoveredIndex === null
                    ? vivid
                    : hoveredIndex === i
                      ? vivid
                      : muted ?? vivid;
            }
         

            return (
                <g
                  key={source ?? i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: slice.value > 0 ? "pointer" : "default" }}
                >
                    <path
                        d={arc}
                        fill={arcFill}
                        stroke="#fff"
                        strokeWidth={1}
                    />
                    {showCallout ? (
                      <>
                        <line
                            x1={centroid[0]}
                            y1={centroid[1]}
                            x2={inflexionPoint[0]}
                            y2={inflexionPoint[1]}
                            stroke={arcFill}
                        />
                        <line
                            x1={inflexionPoint[0]}
                            y1={inflexionPoint[1]}
                            x2={labelPosX}
                            y2={inflexionPoint[1]}
                            stroke={arcFill}
                        />
                        <text
                            x={labelPosX + (isRightLabel ? 2 : -2)}
                            y={inflexionPoint[1]}
                            textAnchor={textAnchor}
                            dominantBaseline="middle"
                            fontSize={fontSize.label}
                            fill={arcFill}
                        >
                            {label}
                        </text>
                      </>
                    ) : null}
                </g>
            )
        })}
        <circle r={innerRadius - 1} fill="white"/>
        <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize.label} fontWeight={600}>{year}</text>
      </g>
    </svg>
  );
};


export const ResponsiveDonutPlot = ( props ) => {
    const chartRef = useRef(null);
    const chartSize = useDimensions(chartRef);
    return (
      <div ref={chartRef} style={{ width: "100%", height: 300 }}>
        <DonutPlot width={chartSize.width} height={chartSize.height} {...props} />
      </div>
    );
  };

  export default ResponsiveDonutPlot;
