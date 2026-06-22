import { useMemo, useRef, useState, useContext } from "react";
import * as d3 from "d3";
import { sourceContext } from './DashboardContext.jsx';
import { useDimensions } from './use-dimensions'
import { muteColor } from './muteColor.js'
import { AxisBottom } from './AxisBottom.jsx' 
import { AxisLeft } from './AxisLeft.jsx' 
import { LabelWithBackground } from './LabelWithBackground.jsx'
import { Cursor } from './Cursor.jsx'
import { formatCursorLabel } from './formatCursorLabel.js'
import { fontSize } from './theme/typography.js'

const COMBINED_SOURCE = 'combined';

const SOURCES = [
  "coal",
  "oil",
  "gas",
  "hydro",
  "nuclear",
  "solar",
  "wind",
  "biofuel",
  "other_renewable"
];

function AllNullOrZeroStackedArea(data) {
  return data.every(d => SOURCES.every(s => d[s] === null || d[s] === 0 || d[s] === undefined));
}

export const AreaPlot = ({ width, height, countryData, sourceColors, cursorPosition, setCursorPosition = () => {} }) => {
    const { selectedSource, setSelectedSource } = useContext(sourceContext);
    const sources = useMemo(
      () => Object.keys(sourceColors ?? {}).filter((s) => s !== COMBINED_SOURCE),
      [sourceColors],
    );

    const [hoveredSource, setHoveredSource] = useState(null);
    const allNullData = useMemo(() => AllNullOrZeroStackedArea(countryData), [countryData]);

    // Sidebar selection, or hover when viewing all sources
    const emphasizedSource = useMemo(() => {
      if (selectedSource !== COMBINED_SOURCE) return selectedSource;
      return hoveredSource;
    }, [selectedSource, hoveredSource]);

    const stackSeries = d3
        .stack()
        .keys(sources)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
    const series = stackSeries(countryData);

    // Margins (extra right space for source labels)
    const margin = { top: 44, right: 120, bottom: 40, left: 60 };
    const LABEL_GAP = 8;
    const innerWidth = Math.max(0, (width ?? 0) - margin.left - margin.right);
    const innerHeight = Math.max(0, (height ?? 0) - margin.top - margin.bottom);

    // X axis
    const [xMin, xMax] = d3.extent(countryData, (d) => d.year);
    const xScale = useMemo(() => {
        return d3
        .scaleLinear()
        .domain([xMin || 0, xMax || 0])
        .range([0, innerWidth]);
    }, [countryData, innerWidth]);

    // Y axis
    const totalPerYear = useMemo(() => countryData.map((d) => {
        return {
            year: d.year,
            total: sources.map((s)=> d[s]).reduce((acc, d)=> acc + d, 0)
        }
    }), [countryData, sources]);
    

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(totalPerYear, (d) => d.total)])
        .range([innerHeight, 0]);

    const areaBuilder = d3.area()
        .x((d) => xScale(d.data.year))
        .y1((d) => yScale(d[1]))
        .y0((d) => yScale(d[0]));

    const drawOrder = useMemo(() => {
      if (!emphasizedSource) return sources;
      return [
        ...sources.filter((s) => s !== emphasizedSource),
        emphasizedSource,
      ];
    }, [sources, emphasizedSource]);

    const sourceLabels = useMemo(() => {
      return series.map((serie) => {
        const last = serie[serie.length - 1];
        if (!last) return null;
        const x = xScale(last.data.year);
        const y = (yScale(last[0]) + yScale(last[1])) / 2;
        const source = serie.key;
        const color = sourceColors?.[source];
        const opacity =
          emphasizedSource == null || emphasizedSource === source
            ? 1 :
            hoveredSource === source ? 1 : 0.3;
        const labelX = innerWidth + LABEL_GAP + 4;
        return { source, x, y, color, opacity, labelX };
      }).filter(Boolean);
    }, [series, xScale, yScale, innerWidth, sourceColors, emphasizedSource, hoveredSource]);

    const onMouseMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      setCursorPosition(mouseX);
    };

    /** Snap line + dot to nearest year on the emphasized stack layer. */
    const cursorSnap = useMemo(() => {
      if (cursorPosition == null) return null;
      const year = xScale.invert(cursorPosition);
      const source =
        emphasizedSource && sources.includes(emphasizedSource)
          ? emphasizedSource
          : sources[1];
      const rows = countryData;
      if (!rows.length || !source) return null;
      const i = d3.bisector((d) => d.year).center(rows, year);
      const closest = rows[Math.max(0, Math.min(i, rows.length - 1))];
      const serie = series.find((s) => s.key === source);
      if (!serie) return null;
      const stackPoint = serie.find((p) => p.data.year === closest.year);
      if (!stackPoint) return null;
      const circle = emphasizedSource && sources.includes(emphasizedSource);
      const v = Number(closest[source]) || 0;
      return {
        x: xScale(closest.year),
        y: yScale(stackPoint[1]),
        circle,
        label: circle ? formatCursorLabel(closest.year, v) : null,
        source: source,
      };
    }, [
      cursorPosition,
      xScale,
      yScale,
      countryData,
      series,
      emphasizedSource,
      sources,
    ]);

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
        <svg width={width} height={height} role="img" aria-label="Energy consumption by source over time stacked area chart"
        overflow={'visible'}>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                <g transform={`translate(0, ${innerHeight})`}>                
                    <AxisBottom xScale={xScale} pixelsPerTick={50} innerHeight={innerHeight} label="Year" />
                </g>
                <AxisLeft yScale={yScale} pixelsPerTick={50} innerWidth={innerWidth} label="Energy (TWh)" tickDivisor={1000} />
            </g>
            <g
              transform={`translate(${margin.left}, ${margin.top})`}
              onMouseMove={onMouseMove}
              onMouseLeave={() => setCursorPosition(null)}
            >
                <rect
                  x={0}
                  y={0}
                  width={innerWidth}
                  height={innerHeight}
                  visibility="hidden"
                  pointerEvents="all"
                />
                {drawOrder.map((source) => {
                  const serie = series.find((s) => s.key === source);
                  const label = sourceLabels.find((l) => l.source === source);
                  if (!serie) return null;

                  const color = sourceColors?.[source];
                  const opacity =
                  emphasizedSource == null || emphasizedSource === source
                        ? 1
                        : hoveredSource === source ? 1 : 0.3;

                  const useElbow = source === 'other_renewable';
                  const endY = label && useElbow ? label.y - 14 : label?.y;
                  const leaderPath =
                    label && useElbow
                      ? `M ${label.x} ${label.y} L ${label.labelX} ${label.y} L ${label.labelX} ${endY}`
                      : null;

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
                        d={areaBuilder(serie)}
                        fill={color}
                        opacity={opacity}
                        stroke="#fff"
                        strokeWidth={0.5}
                        strokeLinejoin="round"
                      />
                      {label ? (
                        <>
                          {useElbow ? (
                            <path
                              d={leaderPath}
                              fill="none"
                              stroke={color}
                              strokeWidth={1.5}
                              pointerEvents="stroke"
                            />
                          ) : (
                            <line
                              x1={label.x}
                              y1={label.y}
                              x2={label.labelX}
                              y2={label.y}
                              stroke={color}
                              strokeWidth={1.5}
                              pointerEvents="stroke"
                            />
                          )}
                          <LabelWithBackground
                            x={label.labelX + 4}
                            y={endY}
                            text={source.replace(/_/g, ' ')}
                            fill={color}
                            opacity={opacity}
                            showBackground={
                              emphasizedSource === source
                            }
                            pointerEvents="all"
                          />
                        </>
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
                      emphasizedSource ? sourceColors?.[emphasizedSource] : '#737270'
                    }
                  />
                )}
            </g>
        </svg>
    )
}

export const ResponsiveAreaPlot = ( props ) => {
    const chartRef = useRef(null);
    const chartSize = useDimensions(chartRef);
    return (
      <div ref={chartRef} style={{ width: "100%", height: 400 }}>
        <AreaPlot width={chartSize.width} height={chartSize.height} {...props} />
      </div>
    );
  };

  export default ResponsiveAreaPlot;