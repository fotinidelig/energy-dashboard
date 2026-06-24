import { fontSize } from './theme/typography.js'

const CHAR_WIDTH = 0.5;

function lineWidth(text, fs) {
  return text.length * fs * CHAR_WIDTH;
}

/**
 * Cursor tooltip label — single or multi-line, with source names bold + colored.
 *
 * label shape:
 *   { header?: string, rows: { source: string, rest: string }[] }
 *
 * Example short row:  { source: 'solar', rest: ' in 2023: 13kTWh' }
 * Example multi row:   { source: 'hydro', rest: ': 12kTWh' }
 */
export function CursorLabel({
  x,
  y,
  label,
  sourceColors,
  fontSize: fs = fontSize.label,
  textAnchor = 'start',
  padX = 4,
  padY = 3,
  pointerEvents = 'none',
}) {
  if (!label?.rows?.length) return null;

  const lineHeight = fs * 1.35;
  const { header, rows } = label;
  const lineCount = (header ? 1 : 0) + rows.length;
  const textHeight = lineCount * lineHeight;

  const lineTexts = [
    ...(header ? [header] : []),
    ...rows.map(({ source, rest }) => `${source.replace(/_/g, ' ')}${rest}`),
  ];
  const textWidth = Math.max(...lineTexts.map((t) => lineWidth(t, fs)));

  const rectX =
    textAnchor === 'end'
      ? x - textWidth - padX
      : textAnchor === 'middle'
        ? x - textWidth / 2 - padX
        : x - padX;

  // Explicit per-line y + middle baseline — Safari misaligns dominantBaseline="hanging".
  const lineY = (index) => y + padY + fs / 2 + index * lineHeight;

  let lineIndex = 0;

  return (
    <g pointerEvents={pointerEvents} overflow="visible">
      <rect
        x={rectX}
        y={y}
        width={textWidth + padX * 2}
        height={textHeight + padY * 2}
        fill="white"
        stroke="#b8c0c7"
        strokeWidth={2}
        rx={5}
      />
      <text
        className="text-cursor"
        textAnchor={textAnchor}
        fontSize={fs}
        fill="#111827"
      >
        {header ? (
          <tspan
            x={x}
            y={lineY(lineIndex++)}
            dominantBaseline="middle"
            fontWeight={700}
          >
            {header}
          </tspan>
        ) : null}
        {rows.map(({ source, rest }) => {
          const sourceLabel = source.replace(/_/g, ' ');
          const color = sourceColors?.[source] ?? '#111827';
          const rowY = lineY(lineIndex++);

          return (
            <tspan key={source} x={x} y={rowY} dominantBaseline="middle">
              <tspan fontWeight={700} fill={color}>
                {sourceLabel}
              </tspan>
              <tspan fill="#111827">{rest}</tspan>
            </tspan>
          );
        })}
      </text>
    </g>
  );
}
