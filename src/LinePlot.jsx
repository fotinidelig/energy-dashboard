import { useMemo, useRef, useContext, useState } from "react";

import * as d3 from "d3";
import { sourceContext } from './DashboardContext.jsx';
import { useDimensions } from './use-dimensions'
import { AxisLeft } from './AxisLeft.jsx'
import { AxisBottom } from './AxisBottom.jsx'
import { LabelWithBackground } from './LabelWithBackground.jsx'
import { Cursor } from './Cursor.jsx'
import { buildCursorLabelShort, buildCursorLabelMulti } from './formatCursorLabel.js'
import { fontSize } from './theme/typography.js'

const COMBINED_SOURCE = 'combined';
const renewableSources = [
  "hydro",
  "solar",
  "wind",
  "biofuel",
  "other_renewable"];

function AllNullOrZeroLinePlot(data) {
  return data.every(d => renewableSources.every(s => d[s] === null || d[s] === 0 || d[s] === undefined));
}

export const LinePlot = ({ width, height, data, sourceColors }) => {
    const [cursorPosition, setCursorPosition] = useState(null);
    const { selectedSource, setSelectedSource } = useContext(sourceContext);
    const [hoveredSource, setHoveredSource] = useState(null);
    const renewableData = useMemo(() => {
        return data.map((d) => ({
            year: d.year,
            ...Object.fromEntries(
              renewableSources.map((s) => [s, Number(d[s]) || 0]),
            ),
        }));
    }, [data]);

    const emphasizedSource = useMemo(() => {
      if (selectedSource !== COMBINED_SOURCE) return selectedSource;
      return hoveredSource;
    }, [selectedSource, hoveredSource]);

    // Margins (extra right space for source labels)
    const margin = { top: 44, right: 120, bottom: 40, left: 60 };
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

    // Y axis — only renewable columns (Object.values would include `year`)
    const maxValue = useMemo(
      () =>
        d3.max(renewableData, (d) =>
          d3.max(renewableSources, (s) => d[s] ?? 0),
        ) ?? 0,
      [renewableData],
    );

    const yScale = useMemo(
      () => d3.scaleLinear().domain([0, maxValue]).range([innerHeight, 0]).nice(),
      [maxValue, innerHeight],
    );

    const lines = useMemo(() => {
      return renewableSources.map((s) => {
        const lineBuilder = d3.line()
          .x((d) => xScale(d.year))
          .y((d) => yScale(d[s]));
        return {
          source: s,
          path: lineBuilder(renewableData),
          color: sourceColors?.[s]
        };
      });
    }, [renewableData, renewableSources, xScale, yScale, sourceColors]);

    const sourceLabels = useMemo(() => {
      const last = renewableData[renewableData.length - 1];
      const x = xScale(xMax);
      return lines.map((line) => {
        const source = line.source;
        if (!last || !last[source]) return null;
        const y = yScale(last[source]);
        const color = sourceColors?.[source];
        const opacity =
          emphasizedSource == null || emphasizedSource === source
            ? 1 :
            hoveredSource === source ? 1 : 0.3;
        const labelX = innerWidth + 4;
        return { source, x, y, color, opacity, labelX };
      }).filter(Boolean);
    }, [lines, xScale, yScale, innerWidth, sourceColors, emphasizedSource, renewableData, xMax]);

    const drawOrder = useMemo(() => {
      if (!emphasizedSource || !renewableSources.includes(emphasizedSource)) {
        return renewableSources;
      }
      return [
        ...renewableSources.filter((s) => s !== emphasizedSource),
        emphasizedSource,
      ];
    }, [emphasizedSource]);

    const onMouseMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      setCursorPosition(mouseX);
    };

    /** Snap line + dot to nearest year in the data (pixel x = xScale(year)). */
    const cursorSnap = useMemo(() => {
      if (cursorPosition == null) return null;
      const year = xScale.invert(cursorPosition);
      const source =
        emphasizedSource && renewableSources.includes(emphasizedSource)
          ? emphasizedSource
          : renewableSources[1];
      const rows = renewableData;
      if (!rows.length) return null;
      const i = d3.bisector((d) => d.year).center(rows, year);
      const closest = rows[Math.max(0, Math.min(i, rows.length - 1))];      
      const circle = emphasizedSource && renewableSources.includes(emphasizedSource);

      let label, x, y;
      if (!circle) {
        const values = renewableSources.map((s) => Number(closest[s]) || 0);
        label = buildCursorLabelMulti(closest.year, values, renewableSources);
        x = xScale(closest.year);
        y = yScale(d3.mean(values));
      } else {
        const v = Number(closest[source]) || 0;
        label = buildCursorLabelShort(closest.year, v, source);
        x = xScale(closest.year);
        y = yScale(v);
      }
      return {
        x,
        y,
        circle,
        label,
        source,
      };
    }, [
      cursorPosition,
      xScale,
      yScale,
      renewableData,
      emphasizedSource,
      renewableSources,
    ]);

    const allNullData = useMemo(() => AllNullOrZeroLinePlot(renewableData), [renewableData]);
    if (allNullData) {
      return (
        <svg width={width} height={height} style={{ display: "inline-block" }}>
          <g transform={`translate(${width / 2}, ${height / 2})`}>
            <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" 
            fontSize={fontSize.subheader} 
            fontWeight={600}
            fill="#A82107">No data available</text>
          </g>
        </svg>
      );
    }

    return (
    <div>
      <svg width={width} height={height} overflow={'visible'}>
        <g transform={`translate(${[margin.left, margin.top].join(",")})`}>
          <g transform={`translate(0, ${innerHeight})`}>
            <AxisBottom xScale={xScale} pixelsPerTick={50} innerHeight={innerHeight} label="Year" />
          </g>
          <AxisLeft yScale={yScale} pixelsPerTick={50} innerWidth={innerWidth} label="Energy (TWh)" tickDivisor={1000} />
        </g>
        <g
          width={innerWidth}
          height={innerHeight}
          transform={`translate(${[margin.left, margin.top].join(",")})`}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setCursorPosition(null)}
        >
          <rect x={0} y={0} width={innerWidth} height={innerHeight}
            visibility={"hidden"} pointerEvents={"all"} />
          {drawOrder.map((source) => {
            const line = lines.find((l) => l.source === source);
            if (!line) return null;
            const label = sourceLabels.find((l) => l.source === source);
            const color = sourceColors?.[source];
            const opacity =
              emphasizedSource == null || emphasizedSource === source  
                ? 1 :
                hoveredSource === source ? 1 : 0.3;

            return (
              <g
                key={source}
                className="series"
                onMouseEnter={() => setHoveredSource(source)}
                onMouseLeave={() => setHoveredSource(null)}
                onClick={() =>
                  setSelectedSource(
                    selectedSource === source ? COMBINED_SOURCE : source,
                  )
                }
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={line.path}
                  fill="none"
                  strokeWidth={3}
                  stroke={color}
                  opacity={opacity}
                  pointerEvents="stroke"
                />
                {label ? (
                  <LabelWithBackground
                    x={label.labelX + 4}
                    y={label.y}
                    text={source.replace(/_/g, ' ')}
                    fill={color}
                    opacity={opacity}
                    showBackground={
                      emphasizedSource === source
                    }
                    pointerEvents="all"
                  />
                ) : null}
              </g>
            );
          })}
          {cursorSnap != null && (
            <Cursor
              height={innerHeight}
              x={cursorSnap.x}
              y={cursorSnap.y}
              circle={cursorSnap.circle}
              label={cursorSnap.label}
              sourceColors={sourceColors}
              color={emphasizedSource ? sourceColors?.[emphasizedSource] : '#737270'}
            />
          )}
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