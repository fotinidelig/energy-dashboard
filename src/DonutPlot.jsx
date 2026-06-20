import { useMemo, useRef, useState, useContext } from "react";
import * as d3 from 'd3';
import { sourceContext } from './DashboardContext.jsx';
import { useDimensions } from './use-dimensions'
import { muteColor } from './muteColor.js'
import { LabelWithBackground } from './LabelWithBackground.jsx'
import { fontSize } from './theme/typography.js'
import './theme/typography.css';

const COMBINED_SOURCE = 'combined';

const renewableSources = [
  "hydro",
  "solar",
  "wind",
  "biofuel",
  "other_renewable"];

function AllNullOrZeroDonut(data) {
  return data.every(d => d.value === null || d.value === 0 || d.value === undefined);
}

export const DonutPlot = ({ width, height, data, year, sourceColors }) => {
    const { selectedSource, setSelectedSource } = useContext(sourceContext);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const inflexionPadding = 10;

    const outerRadius = Math.min(width, height) / 2 - 35;
    const innerRadius = outerRadius * 0.5;
    const centerX = width / 2;
    const centerY = height / 2;

    const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

    const sourceMutedColors = useMemo(
      () => (sourceColors ? muteColor(sourceColors) : undefined),
      [sourceColors],
    );

    const allNullData = useMemo(() => AllNullOrZeroDonut(data), [data]);

    const ORDER = [
      'coal','oil','gas','nuclear',
      'hydro','solar','wind','biofuel','other_renewable'
    ];
    
    const rows = useMemo(() => {
      const safe = Array.isArray(data) ? data : []
      return [...safe].sort(
        (a, b) => ORDER.indexOf(a.source) - ORDER.indexOf(b.source),
      )
    }, [data]);

    const pie = useMemo(() => {
      // Important: sort(null) disables value-based reordering so our ORDER is respected.
      const pieGenerator = d3.pie().value((d) => d.value).sort(null)
      return pieGenerator(rows)
    }, [rows])

    const renewablePie = useMemo(() => {
      return pie.filter((p) => renewableSources.includes(p.data.source))
    }, [pie])

    const renewableStartAngle = useMemo(() => {
      return renewablePie[0].startAngle
    }, [renewablePie])

    const renewableEndAngle = useMemo(() => {
      return renewablePie[renewablePie.length - 1].endAngle
    }, [renewablePie])

    const emphasizedSource = useMemo(() => {
      if (selectedSource !== COMBINED_SOURCE) return selectedSource;
      const hovered = hoveredIndex != null ? pie[hoveredIndex]?.data?.source : null;
      return hovered ?? null;
    }, [selectedSource, hoveredIndex, pie]);

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

    const renewableArc = useMemo(() => {
      return arcPathGenerator({
        innerRadius: outerRadius + 7,
        outerRadius: outerRadius + 11,
        startAngle: renewableStartAngle,
        endAngle: renewableEndAngle,
      })
    }, [outerRadius, renewableStartAngle, renewableEndAngle])

    const renewableArcFill = '#5F9EA0';

    const renewablePercent = useMemo(() => {
      return ((renewablePie.reduce((acc, p) => acc + p.value, 0) / total) * 100).toFixed(1)
    }, [renewablePie, total])

    const renewableCallout = useMemo(() => {
      if (!renewablePie.length) return null

      const sliceInfo = {
        innerRadius: outerRadius + 7,
        outerRadius: outerRadius + 11,
        startAngle: renewableStartAngle,
        endAngle: renewableEndAngle,
      }

      const centroid = arcPathGenerator.centroid(sliceInfo)

      const inflexionInfo = {
        innerRadius: outerRadius + inflexionPadding + 10,
        outerRadius: outerRadius + inflexionPadding + 10,
        startAngle: renewableStartAngle,
        endAngle: renewableEndAngle,
      }
      const inflexionPoint = arcPathGenerator.centroid(inflexionInfo)
      const isRightLabel = inflexionPoint[0] > 0
      const labelPosX = inflexionPoint[0] + 12 * (isRightLabel ? 1 : -1)

      return {
        centroid,
        inflexionPoint,
        labelPosX,
        textAnchor: isRightLabel ? 'start' : 'end',
      }
    }, [
      renewablePie,
      outerRadius,
      renewableStartAngle,
      renewableEndAngle,
      arcPathGenerator,
      inflexionPadding,
    ])

  if (allNullData) {
    return (
      <svg width={width} height={height} style={{ display: "inline-block" }}>
        <g transform={`translate(${width / 2}, ${height / 2})`}>
          <text x={0} y={0} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fontSize={fontSize.subheader} 
          fill="#A82107"
          fontWeight={600}>No data available</text>
        </g>
      </svg>
    );
  }

  return (
    <svg width={width} height={height} style={{ display: "inline-block" }}>
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
            const pct = ((slice.value / total) * 100).toFixed(1)
            const label = `${source} (${pct}%)`;

            const showCallout =
              slice.value > 0 &&
              (hoveredIndex === i ||
                (selectedSource !== COMBINED_SOURCE && selectedSource === source));

            const vivid = source ? sourceColors?.[source] : undefined;
            const muted = source ? sourceMutedColors?.[source] : undefined;
            const arcFill =
              vivid == null
                ? '#ccc'
                : emphasizedSource == null || emphasizedSource === source
                  ? vivid
                  : muted ?? vivid;

            return (
                <g
                  key={source ?? i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    if (slice.value <= 0 || !source) return;
                    setSelectedSource(
                      selectedSource === source ? COMBINED_SOURCE : source,
                    );
                  }}
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
                        <LabelWithBackground
                          x={labelPosX + (isRightLabel ? 2 : -2)}
                          y={inflexionPoint[1]}
                          text={label}
                          fill={arcFill}
                          textAnchor={textAnchor}
                          showBackground
                        />
                      </>
                    ) : null}
                </g>
            )
        })}
        {hoveredIndex == null && renewableCallout ? (
          <>
          <path
            d={renewableArc}
            fill={renewableArcFill}
            stroke="#fff"
            strokeWidth={1}
          />
            <line
              x1={renewableCallout.centroid[0]}
              y1={renewableCallout.centroid[1]}
              x2={renewableCallout.inflexionPoint[0]}
              y2={renewableCallout.inflexionPoint[1]}
              stroke={renewableArcFill}
              pointerEvents="none"
            />
            <line
              x1={renewableCallout.inflexionPoint[0]}
              y1={renewableCallout.inflexionPoint[1]}
              x2={renewableCallout.labelPosX}
              y2={renewableCallout.inflexionPoint[1]}
              stroke={renewableArcFill}
              pointerEvents="none"
            />
            <LabelWithBackground
              x={renewableCallout.labelPosX + (renewableCallout.textAnchor === 'start' ? 2 : -2)}
              y={renewableCallout.inflexionPoint[1]}
              text={`renewables (${renewablePercent}%)`}
              fill={renewableArcFill}
              textAnchor={renewableCallout.textAnchor}
              showBackground
              pointerEvents="none"
            />
          </>
        ) : null}
        <circle r={innerRadius - 1} fill="white"/>
        <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize.subheader} fontWeight={600}>{year}</text>
      </g>
    </svg>
  );
};


export const ResponsiveDonutPlot = ( props ) => {
    const chartRef = useRef(null);
    const chartSize = useDimensions(chartRef);
    return (
      <div ref={chartRef} style={{ width: "100%", height: 400 }}>
        <DonutPlot width={chartSize.width} height={chartSize.height} {...props} />
      </div>
    );
  };

  export default ResponsiveDonutPlot;
