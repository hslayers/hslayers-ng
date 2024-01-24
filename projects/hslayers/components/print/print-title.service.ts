import {Injectable} from '@angular/core';

import {TextStyle} from './types/text-style.type';

@Injectable({
  providedIn: 'root',
})
export class HsPrintTitleService {
  constructor() {}

  /**
   * Draw canvas with styled text
   * @param text - Text string
   * @param textStyle - Text style object
   */
  drawTitleCanvas(
    text: string,
    textStyle: TextStyle,
  ): Promise<HTMLCanvasElement> {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      this.applyTextStyles(ctx, textStyle);
      const textHeight = Number(textStyle.textSize.replace(/[^0-9]+/, ''));
      this.drawTitle(ctx, text, textStyle, textHeight);
      //Necessary in order to measure text width and height, so that the canvas can be adjusted accordingly
      setTimeout(() => {
        canvas.width = ctx.measureText(text).width + 10;
        canvas.height = textHeight + 20;
        canvas.style.width = canvas.width + 'px';
        this.applyTextStyles(ctx, textStyle);
        this.drawTitle(ctx, text, textStyle, textHeight);
        resolve(canvas);
      }, 0);
    });
  }

  /**
   * Draw title text inside canvas
   * @param ctx - Title canvas context
   * @param text - Text string
   * @param textStyle - Text style object
   * @param yPos - Y pixels position
   */
  private drawTitle(
    ctx: CanvasRenderingContext2D,
    text: string,
    textStyle: TextStyle,
    yPos: number,
  ): void {
    if (textStyle.textDraw === 'stroke') {
      ctx.strokeText(text, 0, yPos);
    } else {
      ctx.fillText(text, 0, yPos);
    }
  }

  /**
   * Apply styles to title canvas context
   * @param ctx - Title canvas context
   * @param textStyle - Text style object
   */
  private applyTextStyles(
    ctx: CanvasRenderingContext2D,
    textStyle: TextStyle,
  ): void {
    ctx.font = textStyle.fontStyle.concat(
      ' ',
      textStyle.textSize,
      ' ',
      textStyle.fontFamily,
    );
    if (textStyle.textColor) {
      ctx.strokeStyle = textStyle.textColor;
      ctx.fillStyle = textStyle.textColor;
    }
  }
}
