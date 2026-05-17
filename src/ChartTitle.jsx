import { fontSize } from './theme/typography.js'

export const ChartTitle = ({ width, children }) => (
  <text
    x={width / 2}
    y={18}
    textAnchor="middle"
    dominantBaseline="middle"
    fontSize={fontSize.subheader}
    fontWeight={600}
    fill="#111827"
  >
    {children}
  </text>
)
