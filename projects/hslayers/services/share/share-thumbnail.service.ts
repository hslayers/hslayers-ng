import {Injectable, Renderer2, RendererFactory2} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';

@Injectable({
  providedIn: 'root',
})
export class HsShareThumbnailService {
  private readonly THUMBNAIL_SIZE = 200;
  private readonly SCALE_FACTOR = 2.5;

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

    const canvasLayers =
      this.HsMapService.mapElement.querySelectorAll('.ol-layer canvas');
    if (canvasLayers.length === 0) {
      this.HsLogService.warn('No canvas layers found to generate thumbnail.');
      // Optionally set a default image or return early
      $element.setAttribute(
        'src',
        this.hsConfig.assetsPath + 'img/notAvailable.png',
      );
      return;
    }

    let thumbnail: string | undefined;
    const collectorCanvas = this.renderer.createElement('canvas');
    const targetCanvas = this.renderer.createElement('canvas');
    const width = this.THUMBNAIL_SIZE,
      height = this.THUMBNAIL_SIZE;
    const scaleFactor = this.SCALE_FACTOR; // Capture a 3x larger area
    const captureWidth = width * scaleFactor;
    const captureHeight = height * scaleFactor;

    const firstCanvas = canvasLayers[0]; // Use the first found canvas for dimensions

    this.setCanvasSize(targetCanvas, width, height);
    // Use dimensions from the actual first canvas found
    this.setCanvasSize(
      collectorCanvas,
      firstCanvas.width, // Use actual width
      firstCanvas.height, // Use actual height
    );

    const ctxCollector = collectorCanvas.getContext('2d');
    const ctxTarget = targetCanvas.getContext('2d');
    this.setupContext(ctxTarget);
    this.setupContext(ctxCollector);

    // Iterate over the found canvas layers using for...of
    for (const canvas of Array.from<HTMLCanvasElement>(canvasLayers)) {
      if (canvas.width > 0) {
        const opacity = (canvas.parentNode as HTMLElement).style.opacity;
        ctxCollector.globalAlpha = opacity === '' ? 1 : Number(opacity);
        const transform = canvas.style.transform;

        if (transform && transform.startsWith('matrix(')) {
          // Get the transform parameters from the style's transform matrix
          const matrix = transform
            .slice(7, -1) // Faster than regex for simple 'matrix(...)'
            .split(',')
            .map(Number);
          // Apply the transform to the collector context directly
          ctxCollector.setTransform(...matrix);
        } else {
          // Reset transform if none is applied to the current canvas
          ctxCollector.setTransform(1, 0, 0, 1, 0, 0);
        }
        ctxCollector.drawImage(canvas, 0, 0);
      }
    }
    // Reset transform for the final draw operation
    ctxCollector.setTransform(1, 0, 0, 1, 0, 0);

    /* Final render pass: Capture a larger area and scale it down */
    // Calculate source coordinates and dimensions, ensuring they are within bounds
    const sx = Math.max(
      0,
      Math.floor(collectorCanvas.width / 2 - captureWidth / 2),
    );
    const sy = Math.max(
      0,
      Math.floor(collectorCanvas.height / 2 - captureHeight / 2),
    );
    const sWidth = Math.min(captureWidth, collectorCanvas.width - sx);
    const sHeight = Math.min(captureHeight, collectorCanvas.height - sy);

    ctxTarget.drawImage(
      collectorCanvas,
      sx, // source x
      sy, // source y
      sWidth, // source width
      sHeight, // source height
      0, // destination x
      0, // destination y
      width, // destination width (final thumbnail size)
      height, // destination height (final thumbnail size)
    );
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
