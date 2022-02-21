import {Injectable} from '@angular/core';

import {HsPrintLegendService} from './print-legend.service';
import {ImprintObj} from './models/imprint-object.model';
import {TextStyle} from './models/text-style.model';

@Injectable({
  providedIn: 'root',
})
export class HsPrintImprintService {
  constructor(private hsPrintLegendService: HsPrintLegendService) {}

  /**
   * Draw imprint canvas
   * @param imprintObj - Imprint object
   */
  drawImprintCanvas(imprintObj: ImprintObj): Promise<HTMLCanvasElement> {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = await this.hsPrintLegendService.svgToImage(
        this.imprintToSvg(imprintObj)
      );
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    });
  }

  /**
   * Convert imprint styles and text to an svg
   * @param imprintObj - Imprint object
   */
  private imprintToSvg(imprintObj: ImprintObj): string {
    const styles = this.getStyles(imprintObj.textStyle);
    const height = imprintObj.height ?? 300;
    const width = imprintObj.width ?? 150;
    const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}px' height='${height}px'>
            <foreignObject width='100%' height='100%'>
              <div xmlns='http://www.w3.org/1999/xhtml' style="${styles}">
                <div>${imprintObj.author}</div>
                ${imprintObj.abstract}
              </div>
            </foreignObject>
        </svg>`;
    const svg = 'data:image/svg+xml,' + encodeURIComponent(svgSource);
    return svg;
  }

  /**
   * Get styles string from textStyle object for the svg
   * @param textStyle - TextStyle object
   */
  getStyles(textStyle: TextStyle): string {
    let tmpStyle = 'padding: 2px;';
    if (textStyle.posX === 'right') {
      tmpStyle += 'text-align:end;';
    } else if (textStyle.posX === 'center') {
      tmpStyle += 'text-align:center;';
    } else {
      tmpStyle += 'text-align:start;';
    }
    if (!textStyle.textSize) {
      textStyle.textSize = '12px';
    }
    if (!textStyle.fontFamily) {
      textStyle.fontFamily = 'Times New Roman';
    }
    if (textStyle.textDraw === 'stroke' && textStyle.strokeColor) {
      tmpStyle += `-webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color:${textStyle.strokeColor};`;
    } else if (textStyle.fillColor) {
      tmpStyle += `color: ${textStyle.fillColor};`;
    } else {
      tmpStyle += `color:black;`;
    }
    tmpStyle += `font:${textStyle.fontStyle.concat(
      ' ',
      textStyle.textSize,
      ' ',
      textStyle.fontFamily
    )};`;

    return tmpStyle;
  }
}
