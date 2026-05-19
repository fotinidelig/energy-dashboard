import { useMemo, useRef, useState } from "react";
import * as d3 from 'd3';
import { useDimensions } from './use-dimensions'
import { muteColor } from './muteColor.js'
import { ChartTitle } from './ChartTitle.jsx'
import { fontSize } from './theme/typography.js'

export const BarPlot = ({
  width,
  height,
  data,
  source = 'combined',
  sourceColors,
}) => {

    const [hoveredCountry, setHoveredCountry] = useState(null);

    const safeData = useMemo(() => data ?? [], [data]);

    const sourceMutedColors = useMemo(
      () => (sourceColors ? muteColor(sourceColors) : undefined),
      [sourceColors],
    );

    // Sort once so bars render from highest to lowest (top to bottom).
    // create new column in data called 'total' summing up all energy sources
    const combinedData = safeData.map(d => {
        const combined = d.coal+d.oil+d.gas+d.nuclear+d.hydro+d.solar+d.wind+d.biofuel+d.other_renewable;
        return {
            ...d,
            combined
        }
    });

    const sortedData = useMemo(() => {
      return [...combinedData].sort((a, b) => (b[source] ?? 0) - (a[source] ?? 0));
    }, [combinedData]);
    
    // ToDo: use to construct stacked bar plot

    // 2) Chart dimensions and margins.
    const margin = { top: 44, right: 50, bottom: 15, left: 120 };
    const innerWidth = Math.max(0, (width ?? 0) - margin.left - margin.right);
    const innerHeight = Math.max(0, (height ?? 0) - margin.top - margin.bottom);
  
    const xMax = useMemo(
      () => d3.max(sortedData, (d) => d[source]) ?? 0,
      [sortedData],
    );
  
    const xScale = useMemo(() => {
      return d3.scaleLinear().domain([0, xMax]).range([0, innerWidth]).nice();
    }, [innerWidth, xMax]);
  
    const yScale = useMemo(() => {
      return d3
        .scaleBand()
        .domain(sortedData.map((d) => d.country))
        .range([0, innerHeight])
        .padding(0.2);
    }, [sortedData, innerHeight]);
  
    if (!width || !height) return null;

    return (
        <svg width={width} height={height} role="img" aria-label="Energy consumption by country bar chart"
        overflow={'visible'}>
            <ChartTitle width={width}>Energy consumption by country</ChartTitle>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
            {sortedData.map((d, i) => {
                const y = yScale(d.country);
                if (y === undefined) return null;
                const barWidth = xScale(d[source]);
                const barHeight = yScale.bandwidth();
                const barCenterY = y + barHeight / 2;
                const isHovered = hoveredCountry === d.country;
                const vivid = sourceColors?.[source];
                const muted = sourceMutedColors?.[source];
                const barFill =
                  vivid != null && muted != null
                    ? hoveredCountry === null 
                      ? vivid
                      : isHovered
                        ? vivid
                        : muted
                    : isHovered
                      ? "#2F2D4A"
                      : "#7774aa";

                return (
                    <g
                    key={d.country}
                    onMouseEnter={() => setHoveredCountry(d.country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{ cursor: "pointer" }}
                    >
                    <text
                        x={-10}
                        y={barCenterY}
                        textAnchor="end"
                        dominantBaseline="middle"
                        fill="#111827"
                        fontSize={fontSize.label}
                        fontWeight={isHovered ? 'bold' : 'normal'}
                    >
                        {d.country}
                    </text>

                    <rect
                        x={0}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        className="barplot-bar"
                        style={{ animationDelay: `${i * 30}ms` }}
                        fill={barFill}
                        rx={3}
                    />

                    <text
                        x={barWidth + 8}
                        y={barCenterY}
                        textAnchor="start"
                        dominantBaseline="middle"
                        fill="#111827"
                        fontSize={fontSize.axisInline}
                        fontWeight={isHovered ? 'bold' : 'normal'}
                    >
                        {(d[source] / 1000).toFixed(2)}k
                   
                    </text>
                    </g>
                );
                })}
            </g>
        </svg>
    )
}

export const ResponsiveBarPlot = ( props ) => {
    const chartRef = useRef(null);
    const chartSize = useDimensions(chartRef);
    return (
      <div ref={chartRef} style={{ width: "100%", height: 400 }}>
        <BarPlot width={chartSize.width} height={chartSize.height} {...props} />
      </div>
    );
  };

  export default ResponsiveBarPlot;