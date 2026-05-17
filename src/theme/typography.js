/**
 * Same scale as theme/typography.css — for SVG <text fontSize={...} /> and inline styles in JS.
 * Keep values in sync with the CSS custom properties.
 */
export const fontSize = {
  axisInline: 10,
  annotation: 14,
  label: 14,
  body: 16,
  subheader: 20,
  header: 28,
}

/** e.g. fontSize={fontSize.label} → "11px" */
export function fontSizePx(key) {
  return `${fontSize[key]}px`
}
