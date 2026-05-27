import { useSpring, animated } from 'react-spring'
import { fontSize } from './theme/typography.js'
import { LabelWithBackground } from './LabelWithBackground.jsx'

/**
 * Shared SVG cursor used across charts.
 * Renders an animated vertical line + optional dot and value label at (x, y).
 */
export const Cursor = ({ x, y, height, color = '#737270', circle = true, label }) => {
  if (!x || !y) return null;
  const springProps = useSpring({
    to: { x, y },
  })

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
      {circle && label ? (
        <LabelWithBackground
          x={x + 10}
          y={y - 10}
          text={label}
          fill={color}
          fontSize={fontSize.label}
          className="text-cursor"
          showBackground
          pointerEvents="none"
        />
      ) : null}
    </>
  )
}

export default Cursor
