import { useMemo, useRef, useState, useContext } from "react";
import * as d3 from "d3";
import { sourceContext } from './DashboardContext.jsx';
import { useDimensions } from './use-dimensions'
import { muteColor } from './muteColor.js'
import { AxisBottom } from './AxisBottom.jsx' 
import { AxisLeft } from './AxisLeft.jsx' 
import { ChartTitle } from './ChartTitle.jsx'
import { LabelWithBackground } from './LabelWithBackground.jsx'
import { Cursor } from './Cursor.jsx'


const COMBINED_SOURCE = 'combined';

export const AreaPlot = ({ width, height, countryData, sourceColors }) => {
    const { selectedSource, setSelectedSource } = useContext(sourceContext);
    const sources = Object.keys(sourceColors ?? {}).filter(
      (s) => s !== COMBINED_SOURCE,
    );

    const [hoveredSource, setHoveredSource] = useState(null);

    // Sidebar selection, or hover when viewing all sources
    const emphasizedSource = useMemo(() => {
      if (selectedSource !== COMBINED_SOURCE) return selectedSource;
      return hoveredSource;
    }, [selectedSource, hoveredSource]);

    const sourceMutedColors = useMemo(
      () => (sourceColors ? muteColor(sourceColors) : undefined),
      [sourceColors],
    );

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
        const vivid = sourceColors?.[source];
        const muted = sourceMutedColors?.[source];
        const color =
          vivid == null
            ? '#111827'
            : emphasizedSource == null || emphasizedSource === source
              ? vivid
              : muted ?? vivid;
        const labelX = innerWidth + LABEL_GAP + 4;
        return { source, x, y, color, labelX };
      }).filter(Boolean);
    }, [series, xScale, yScale, innerWidth, sourceColors, sourceMutedColors, emphasizedSource]);

    return (
        <svg width={width} height={height} role="img" aria-label="Energy consumption by source over time stacked area chart"
        overflow={'visible'}>
            <ChartTitle width={width}>Energy consumption by source over time</ChartTitle>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                <g transform={`translate(0, ${innerHeight})`}>                
                    <AxisBottom xScale={xScale} pixelsPerTick={50} innerHeight={innerHeight} label="Year" />
                </g>
                <AxisLeft yScale={yScale} pixelsPerTick={50} innerWidth={innerWidth} label="Energy (TWh)" tickDivisor={1000} />
                {drawOrder.map((source) => {
                  const serie = series.find((s) => s.key === source);
                  const label = sourceLabels.find((l) => l.source === source);
                  if (!serie) return null;

                  const vivid = sourceColors?.[source];
                  const muted = sourceMutedColors?.[source];
                  const fill =
                    vivid == null
                      ? '#ccc'
                      : emphasizedSource == null || emphasizedSource === source
                        ? vivid
                        : muted ?? vivid;

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
                        fill={fill}
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
                              stroke={label.color}
                              strokeWidth={1.5}
                              pointerEvents="stroke"
                            />
                          ) : (
                            <line
                              x1={label.x}
                              y1={label.y}
                              x2={label.labelX}
                              y2={label.y}
                              stroke={label.color}
                              strokeWidth={1.5}
                              pointerEvents="stroke"
                            />
                          )}
                          <LabelWithBackground
                            x={label.labelX + 4}
                            y={endY}
                            text={source.replace(/_/g, ' ')}
                            fill={label.color}
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