export type RGB = [number, number, number];
export type HSL = [number, number, number];

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

export function sortByHue(colors: RGB[]): RGB[] {
  return colors.sort((a, b) => {
    const [hA] = rgbToHsl(a[0], a[1], a[2]);
    const [hB] = rgbToHsl(b[0], b[1], b[2]);
    return hA - hB;
  });
}

export function getColorCategory(h: number): number {
  // Define color ranges for rainbow order (in degrees)
  const ranges = [
    { min: 345, max: 360, value: 0 }, // Red
    { min: 0, max: 15, value: 0 },    // Red
    { min: 15, max: 45, value: 1 },   // Orange
    { min: 45, max: 75, value: 2 },   // Yellow
    { min: 75, max: 155, value: 3 },  // Green
    { min: 155, max: 195, value: 4 }, // Cyan
    { min: 195, max: 255, value: 5 }, // Blue
    { min: 255, max: 285, value: 6 }, // Purple
    { min: 285, max: 345, value: 7 }, // Pink
  ];

  for (const range of ranges) {
    if (h >= range.min && h < range.max) {
      return range.value;
    }
  }
  return 0;
}

export function sortByRainbow(colors: RGB[]): RGB[] {
  return colors.sort((a, b) => {
    const [hA, sA, lA] = rgbToHsl(...a);
    const [hB, sB, lB] = rgbToHsl(...b);
    
    // First sort by color category (rainbow order)
    const catA = getColorCategory(hA);
    const catB = getColorCategory(hB);
    if (catA !== catB) return catA - catB;
    
    // Within same category, sort by saturation
    if (Math.abs(sA - sB) > 10) return sB - sA;
    
    // If saturation is similar, sort by lightness
    return lB - lA;
  });
}
