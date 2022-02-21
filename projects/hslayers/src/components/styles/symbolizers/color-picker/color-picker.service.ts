import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsColorPickerService {
  constructor() {}
  addAlpha(color: string, opacity: number): string {
    if (opacity == undefined) {
      return color;
    }
    const t = {...this.hex2Rgb(color), a: opacity};
    return `rgba(${t.r}, ${t.g}, ${t.b}, ${t.a})`;
  }

  hex2Rgb(aRgbHex: string): {r: number; g: number; b: number} {
    if (!aRgbHex) {
      return {r: 0, g: 0, b: 0};
    }
    const rgb = aRgbHex.replace('#', '').match(/.{1,2}/g);
    return {
      r: parseInt(rgb[0], 16),
      g: parseInt(rgb[1], 16),
      b: parseInt(rgb[2], 16),
    };
  }

  generateFontColor(rgbColor: Array<number>): string {
    const [r, g, b] = rgbColor;
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp > 127.5 ? 'black' : 'white';
  }

  colorPickerStyle(bcolor: string, color: string): any {
    return {
      'background-color': bcolor,
      'color': color,
    };
  }
}
