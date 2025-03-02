import { type RGB } from './colors';

export async function extractDominantColor(imageUrl: string): Promise<RGB> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve([0, 0, 0]);

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorMap: { [key: string]: number } = {};
      
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const rgb = `${r},${g},${b}`;
        colorMap[rgb] = (colorMap[rgb] || 0) + 1;
      }

      const dominantColor = Object.entries(colorMap)
        .sort(([, a], [, b]) => b - a)[0][0]
        .split(',')
        .map(Number) as RGB;

      resolve(dominantColor);
    };
  });
}
