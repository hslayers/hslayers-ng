import {Injectable, Renderer2, RendererFactory2} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/components/map';

@Injectable({
  providedIn: 'root',
})
export class HsShareThumbnailService {
  private renderer: Renderer2;
  constructor(
    public HsMapService: HsMapService,
    public HsLogService: HsLogService,
    rendererFactory: RendererFactory2,
    private hsConfig: HsConfig,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  setCanvasSize(canvas, width: number, height: number): void {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  setupContext(ctx): void {
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
  }

  rendered($element, newRender?): string {
    if (!$element) {
      return;
    }
    let thumbnail;
    const collectorCanvas = this.renderer.createElement('canvas');
    const targetCanvas = this.renderer.createElement('canvas');
    const width = 256,
      height = 256;
    const firstCanvas =
      this.HsMapService.mapElement.querySelector('.ol-layer canvas');
    this.setCanvasSize(targetCanvas, width, height);
    this.setCanvasSize(
      collectorCanvas,
      firstCanvas?.width ?? width,
      firstCanvas?.height ?? height,
    );
    const ctxCollector = collectorCanvas.getContext('2d');
    const ctxTarget = targetCanvas.getContext('2d');
    this.setupContext(ctxTarget);
    this.setupContext(ctxCollector);
    Array.prototype.forEach.call(
      this.HsMapService.mapElement.querySelectorAll('.ol-layer canvas'),
      (canvas) => {
        if (canvas.width > 0) {
          //console.log('canvas loop', this.isCanvasTainted(canvas), canvas);
          /* canvases retrieved from mapElement might be already tainted because they can contain
           * images (i.e. maps) retrieved from another sources without CORS
           */
          const opacity = canvas.parentNode.style.opacity;
          ctxCollector.globalAlpha = opacity === '' ? 1 : Number(opacity);
          const transform = canvas.style.transform;
          // Get the transform parameters from the style's transform matrix
          const matrix = transform
            .match(/^matrix\(([^\(]*)\)$/)[1]
            .split(',')
            .map(Number);
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(
            ctxCollector,
            matrix,
          );
          ctxCollector.drawImage(canvas, 0, 0);
        }
      },
    );

    /* Final render pass */
    ctxTarget.drawImage(
      collectorCanvas,
      Math.floor(collectorCanvas.width / 2 - width / 2),
      Math.floor(collectorCanvas.height / 2 - height / 2),
      width,
      height,
      0,
      0,
      width,
      height,
    );
    //console.log('image drawn', this.isCanvasTainted(targetCanvas));
    /**
     * from now on, the targetCanvas is also tainted because another tainted canvas was used
     * to draw inside it
     */

    try {
      /**
       * targetCanvas.toDataURL() fires a SecurityError here
       * see https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image#security_and_tainted_canvases
       */
      $element.setAttribute('src', targetCanvas.toDataURL('image/png'));
      //this.data.thumbnail
      thumbnail = targetCanvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      this.HsLogService.log(
        'catch, is tainted?',
        this.isCanvasTainted(targetCanvas),
      );
      //console.log(targetCanvas);
      this.HsLogService.warn(e);
      $element.setAttribute(
        'src',
        this.hsConfig.assetsPath + 'img/notAvailable.png',
      );
    }
    $element.style.width = width + 'px';
    $element.style.height = height + 'px';
    return thumbnail;
  }

  private isCanvasTainted(canvas: HTMLCanvasElement): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const pixel = canvas.getContext('2d').getImageData(0, 0, 1, 1);
      return false;
    } catch (err) {
      return err.code === 18;
    }
  }
}
