import { interpolateLab } from 'd3'

function muteSingle(color, toward = '#c5ccd4', t = 0.42) {
  return interpolateLab(color, toward)(t)
}

function isStringRecord(x) {
  if (x == null || typeof x !== 'object' || Array.isArray(x)) return false
  const vals = Object.values(x)
  if (vals.length === 0) return false
  return vals.every((v) => typeof v === 'string')
}

/**
 * Blend one CSS color toward a neutral (Lab space).
 * If given a record of string colors, returns a new record with each value muted.
 * @param {string | Record<string, string>} colorOrPalette
 * @param {string} [toward]
 * @param {number} [t]
 */
export function muteColor(colorOrPalette, toward = '#c5ccd4', t = 0.42) {
  if (isStringRecord(colorOrPalette)) {
    return Object.fromEntries(
      Object.entries(colorOrPalette).map(([key, c]) => [
        key,
        muteSingle(c, toward, t),
      ]),
    )
  }
  return muteSingle(colorOrPalette, toward, t)
}

/**
 * @param {Record<string, string>} paletteMap
 * @param {string} [toward]
 * @param {number} [t]
 * @returns {Record<string, string>}
 */
export function mutePalette(paletteMap, toward, t) {
  return muteColor(paletteMap, toward, t)
}
