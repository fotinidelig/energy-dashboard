import { fontSize } from './theme/typography.js'

/**
 * SVG <text> has no background — draw a <rect> behind it when labels overlap.
 */
export function LabelWithBackground({
  x,
  y,
  text,
  fill,
  fontSize: fs = fontSize.label,
  fontWeight = 'normal',
  textAnchor = 'start',
  dominantBaseline = 'middle',
  showBackground = true,
  padX = 2,
  padY = 1,
  className = 'text-label',
  pointerEvents,
}) {
  const textWidth = text.length * fs * 0.5;
  const rectX =
    textAnchor === 'end'
      ? x - textWidth - padX
      : textAnchor === 'middle'
        ? x - textWidth / 2 - padX
        : x - padX;
  const rectY =
    dominantBaseline === 'middle'
      ? y - fs / 2 - padY
      : dominantBaseline === 'hanging'
        ? y - padY
        : y - fs - padY;
  return (
    <g pointerEvents={pointerEvents}>
      {showBackground ? (
        <rect
          x={rectX}
          y={rectY}
          width={textWidth}
          height={fs + padY * 2}
          fill="white"
          rx={5}
        />
      ) : null}
      <text
        className={className}
        x={x}
        y={y}
        textAnchor={textAnchor}
        dominantBaseline={dominantBaseline}
        fill={fill}
        fontSize={fs}
        fontWeight={fontWeight}
      >
        {text}
      </text>
    </g>
  )
}
