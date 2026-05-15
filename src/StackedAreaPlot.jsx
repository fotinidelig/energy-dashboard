import { useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useDimensions } from './use-dimensions'
import { muteColor } from './muteColor.js'
import { AxisBottom } from './AxisBottom.jsx' 
import { AxisLeft } from './AxisLeft.jsx' 


export const AreaPlot = ({ width, height, countryData, country='World', sourceColors }) => {

    const sources = Object.keys(sourceColors ?? {});

    const [hoveredSource, setHoveredSource] = useState(null);

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

    // Margins
    const margin = { top: 15, right: 60, bottom: 15, left: 60 };
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

    const seriesToDraw = useMemo(() => {
      if (!hoveredSource) return series;
      const hovered = series.find((s) => s.key === hoveredSource);
      if (!hovered) return series;
      return [...series.filter((s) => s.key !== hoveredSource), hovered];
    }, [series, hoveredSource]);

    const allPath = seriesToDraw.map((serie) => {
        const path = areaBuilder(serie);
        const source = serie.key;
        const vivid = sourceColors?.[source];
        const muted = sourceMutedColors?.[source];
        const fill =
          vivid == null
            ? '#ccc'
            : hoveredSource === null
              ? vivid
              : hoveredSource === source
                ? vivid
                : muted ?? vivid;

        return (
          <path
            key={source}
            d={path}
            fill={fill}
            stroke="#fff"
            strokeWidth={.5}
            strokeLinejoin="round"
            onMouseEnter={() => setHoveredSource(source)}
            onMouseLeave={() => setHoveredSource(null)}
            style={{ cursor: 'pointer' }}
          />
        );
    });
    return (
        <svg width={width} height={height} role="img" aria-label="Energy consumption by country stacked area chart"
        overflow={'visible'}>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                <g transform={`translate(0, ${innerHeight})`}>                
                    <AxisBottom xScale={xScale} pixelsPerTick={50} innerWidth={innerWidth} label="Year" />
                </g>
                <AxisLeft yScale={yScale} pixelsPerTick={50} innerHeight={innerHeight} label="Energy (TWh)" />
                {allPath}
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