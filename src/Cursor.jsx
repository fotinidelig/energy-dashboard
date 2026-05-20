import { useSpring, animated } from 'react-spring'

/**
 * Shared SVG cursor used across charts.
 * Renders an animated vertical line + a dot at (x, y).
 */
export const Cursor = ({ x, y, height, color = '#111827' }) => {
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
      
      <circle cx={x} cy={y} r={5} fill={color} pointerEvents="none" />
    </>
  )
}

export default Cursor
