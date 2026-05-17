import { useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useDimensions } from './use-dimensions'
import { muteColor } from './muteColor.js'
import { AxisLeft } from './AxisLeft.jsx'
import { AxisBottom } from './AxisBottom.jsx'
import { fontSize } from './theme/typography.js'

export const LinePlot = ({ width, height, data, country='World', sourceColors }) => {
    const [hoveredSource, setHoveredSource] = useState(null);

    const renewableSources = [
        "hydro",
        "solar",
        "wind",
        "biofuel",
        "other_renewable"];
    
    const renewableData = useMemo(() => {
        return data.map((d) => ({
            year: d.year,
            ...Object.fromEntries(
              renewableSources.map((s) => [s, Number(d[s]) || 0]),
            ),
        }));
    }, [data]);
    
    const sourceMutedColors = useMemo(
        () => (sourceColors ? muteColor(sourceColors) : undefined),
        [sourceColors],
      );
    // Margins (extra right space for source labels)
    const margin = { top: 20, right: 120, bottom: 40, left: 60 };
    const innerWidth = Math.max(0, (width ?? 0) - margin.left - margin.right);
    const innerHeight = Math.max(0, (height ?? 0) - margin.top - margin.bottom);

    // X axis
    const [xMin, xMax] = d3.extent(renewableData, (d) => d.year);
    const xScale = useMemo(() => {
        return d3
        .scaleLinear()
        .domain([xMin || 0, xMax || 0])
        .range([0, innerWidth]);
    }, [renewableData, innerWidth]);    

    // Y axis
    const maxValue = d3.max(renewableData, (d) => d3.max(Object.values(d)));

    const yScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([innerHeight, 0]);

    const lines = renewableSources.map((s) => {
        const lineBuilder = d3.line()
            .x((d) => xScale(d.year))
            .y((d) => yScale(d[s]));
        const linePath = lineBuilder(renewableData);
        return {
            source: s,
            path: linePath,
            color: sourceColors?.[s],
            mutedColor: sourceMutedColors?.[s],
        }
    });

    const sourceLabels = useMemo(() => {
      const last = renewableData[renewableData.length - 1];
      const x = xScale(xMax);
      return lines.map((line) => {
        const source = line.source;
        if (!last || !last[source]) return null;
        const y = yScale(last[source]);
        const vivid = sourceColors?.[source];
        const muted = sourceMutedColors?.[source];
        const color =
          vivid == null
          ? '#111827'
          : hoveredSource === null
            ? vivid
            : hoveredSource === source
              ? vivid
              : muted ?? vivid;
        const labelX = innerWidth + 4;
        return { source, x, y, color, labelX };
      }).filter(Boolean);
    }, [lines, xScale, yScale, innerWidth, sourceColors, sourceMutedColors, hoveredSource, renewableData, xMax]);

    return (
    <div>
      <svg width={width} height={height}>
        <g transform={`translate(${[margin.left, margin.top].join(",")})`}>
          <g transform={`translate(0, ${innerHeight})`}>
            <AxisBottom xScale={xScale} innerHeight={innerHeight} label="Year" />
          </g>
          <AxisLeft yScale={yScale} pixelsPerTick={50} innerWidth={innerWidth} label="Energy (TWh)" tickDivisor={1000} />
        </g>
        <g
        width={innerWidth}
          height={innerHeight}
          transform={`translate(${[margin.left, margin.top].join(",")})`}
        >
          {lines.map((line) => {
            const source = line.source;
            const label = sourceLabels.find((l) => l.source === source);
            const vivid = sourceColors?.[source];
            const muted = sourceMutedColors?.[source];
            const stroke =
              vivid == null
                ? '#ccc'
                : hoveredSource === null
                  ? vivid
                  : hoveredSource === source
                    ? vivid
                    : muted ?? vivid;

            return (
              <g
                key={source}
                className="series"
                onMouseEnter={() => setHoveredSource(source)}
                onMouseLeave={() => setHoveredSource(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={line.path}
                  fill="none"
                  strokeWidth={2}
                  stroke={stroke}
                  pointerEvents="stroke"
                />
                {label ? (
                  <text
                    x={label.labelX + 4}
                    y={label.y}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fill={label.color}
                    fontSize={fontSize.label}
                    pointerEvents="all"
                  >
                    {source.replace(/_/g, ' ')}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export const ResponsiveLinePlot = ( props ) => {
    const chartRef = useRef(null);
    const chartSize = useDimensions(chartRef);
    return (
      <div ref={chartRef} style={{ width: "100%", height: 400 }}>
        <LinePlot width={chartSize.width} height={chartSize.height} {...props} />
      </div>
    );
  };

  export default ResponsiveLinePlot;