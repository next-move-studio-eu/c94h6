/**
 * Color utility functions for working with colors.
 * Supports hex (#ffffff) and rgba() formats.
 */

/**
 * Converts a hex color string to rgba format with the specified opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Converts any color format (hex or rgba) to rgba with the specified opacity
 */
export function getColorWithOpacity(color: string, opacity: number): string {
  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
    }
  }
  if (color.startsWith('#')) {
    return hexToRgba(color, opacity);
  }
  return color;
}
