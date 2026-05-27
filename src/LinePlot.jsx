import { useMemo, useRef, useState, useContext } from "react";

import * as d3 from "d3";
import { sourceContext } from './DashboardContext.jsx';
import { useDimensions } from './use-dimensions'
import { muteColor } from './muteColor.js'
import { AxisLeft } from './AxisLeft.jsx'
import { AxisBottom } from './AxisBottom.jsx'
import { ChartTitle } from './ChartTitle.jsx'
import { LabelWithBackground } from './LabelWithBackground.jsx'
import { Cursor } from './Cursor.jsx'
import { formatCursorLabel } from './formatCursorLabel.js'

const COMBINED_SOURCE = 'combined';
const renewableSources = [
  "hydro",
  "solar",
  "wind",
  "biofuel",
  "other_renewable"];

export const LinePlot = ({ width, height, data, sourceColors, cursorPosition, setCursorPosition = () => {} }) => {
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

    const sourceMutedColors = useMemo(
        () => (sourceColors ? muteColor(sourceColors) : undefined),
        [sourceColors],
      );
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
          color: sourceColors?.[s],
          mutedColor: sourceMutedColors?.[s],
        };
      });
    }, [renewableData, renewableSources, xScale, yScale, sourceColors, sourceMutedColors]);

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
          : emphasizedSource == null || emphasizedSource === source
            ? vivid
            : muted ?? vivid;
        const labelX = innerWidth + 4;
        return { source, x, y, color, labelX };
      }).filter(Boolean);
    }, [lines, xScale, yScale, innerWidth, sourceColors, sourceMutedColors, emphasizedSource, renewableData, xMax]);

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
      const v = Number(closest[source]) || 0;
      const circle = emphasizedSource && renewableSources.includes(emphasizedSource);
      return {
        x: xScale(closest.year),
        y: yScale(v),
        circle,
        label: circle ? formatCursorLabel(closest.year, v) : null,
      };
    }, [
      cursorPosition,
      xScale,
      yScale,
      renewableData,
      emphasizedSource,
      renewableSources,
    ]);

    return (
    <div>
      <svg width={width} height={height} overflow={'visible'}>
        <ChartTitle width={width}>Renewable energy over time</ChartTitle>
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
            // onMouseMove={onMouseMove} 
            // onMouseLeave={() => setCursorPosition(null)} 
            visibility={"hidden"} pointerEvents={"all"} />
          {drawOrder.map((source) => {
            const line = lines.find((l) => l.source === source);
            if (!line) return null;
            const label = sourceLabels.find((l) => l.source === source);
            const vivid = sourceColors?.[source];
            const muted = sourceMutedColors?.[source];
            const stroke =
              vivid == null
                ? '#ccc'
                : emphasizedSource == null || emphasizedSource === source
                  ? vivid
                  : muted ?? vivid;

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
                  stroke={stroke}
                  pointerEvents="stroke"
                />
                {label ? (
                  <LabelWithBackground
                    x={label.labelX + 4}
                    y={label.y}
                    text={source.replace(/_/g, ' ')}
                    fill={label.color}
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
              color={
                sourceColors?.[
                  emphasizedSource &&
                  renewableSources.includes(emphasizedSource)
                    ? emphasizedSource
                    : "#737270" // dark grey color
                ] ?? '#737270' // dark grey color
              }
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