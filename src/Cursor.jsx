import { useSpring, animated } from 'react-spring'
import { fontSize } from './theme/typography.js'
import { CursorLabel } from './CursorLabel.jsx'

/**
 * Shared SVG cursor used across charts.
 * Renders an animated vertical line + optional dot and value label at (x, y).
 */
export const Cursor = ({
  x,
  y,
  height,
  color = '#737270',
  circle = true,
  label,
  sourceColors,
}) => {
  if (!x || !y) return null;
  const springProps = useSpring({
    to: { x, y },
  })

  const fs = fontSize.label;
  const lineHeight = fs * 1.35;
  const lineCount = (label?.header ? 1 : 0) + (label?.rows?.length ?? 0);
  const labelY = lineCount > 1 ? y - 10 - lineCount * lineHeight : y - 10;

  return (
    <>
      <animated.line
        x1={springProps.x}
        x2={springProps.x}
        y1={0}
        y2={height}
        stroke={color}
        strokeWidth={1}
        pointerEvents="none"
      />
      {circle && <circle cx={x} cy={y} r={5} fill={color} pointerEvents="none" />}
      {label ? (
        <CursorLabel
          x={x + 10}
          y={labelY}
          label={label}
          sourceColors={sourceColors}
          fontSize={fs}
        />
      ) : null}
    </>
  )
}

export default Cursor
