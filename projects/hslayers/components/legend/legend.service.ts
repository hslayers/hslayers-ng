import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Injectable} from '@angular/core';

import LegendRenderer from 'geostyler-legend/dist/LegendRenderer/LegendRenderer';
import {Feature} from 'ol';
import {Style as GeoStylerStyle} from 'geostyler-style';
import {Image as ImageLayer, Layer, Vector as VectorLayer} from 'ol/layer';
import {OlStyleParser} from 'geostyler-openlayers-parser';
import {SldStyleParser as SLDParser} from 'geostyler-sld-parser';
import {
  Source,
  ImageStatic as Static,
  Vector as VectorSource,
  XYZ,
} from 'ol/source';
import {Style} from 'ol/style';

import {HsLayerSelectorService} from 'hslayers-ng/shared/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLegendDescriptor} from './legend-descriptor.interface';
import {HsStylerService} from 'hslayers-ng/shared/styler';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {InterpolatedSource} from 'hslayers-ng/common/layers';
import {defaultStyle} from 'hslayers-ng/shared/styler';
import {filter} from 'rxjs';
import {
  getAutoLegend,
  getBase,
  getEnableProxy,
  getLegends,
  getShowInLayerManager,
  getSld,
  getTitle,
} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLegendService {
  constructor(
    public hsUtilsService: HsUtilsService,
    public hsStylerService: HsStylerService,
    private hsLayerUtilsService: HsLayerUtilsService,
    public hsLayerSelectorService: HsLayerSelectorService,
    private sanitizer: DomSanitizer,
  ) {
    this.hsLayerSelectorService.layerSelected
      .pipe(filter((layer) => !!layer))
      .subscribe(async (layer) => {
        await this.getLayerLegendDescriptor(layer.layer);
      });
  }

  /**
   * Test if layer is visible and has supported type (conditions for displaying legend)
   * @param layer - Layer to test
   * @returns Return if legend might exist for layer and layer is visible
   */
  legendValid(layer: HsLegendDescriptor): boolean {
    if (layer === undefined || layer.type == undefined) {
      return false;
    }
    if (
      ['vector', 'wms', 'static'].indexOf(layer.type) > -1 &&
      layer.lyr.getVisible()
    ) {
      return true;
    }
    return false;
  }

  /**
   * Get legend graphics for a vector layer based on sld attribute. If no SLD exists, try to generate it from OL style.
   * @param currentLayer - Layer of interest
   * @returns Image as SVG string
   */
  async getVectorLayerLegendSvg(
    currentLayer: VectorLayer<VectorSource>,
  ): Promise<string> {
    try {
      if (currentLayer === undefined) {
        return;
      }
      if (!currentLayer.getStyle()) {
        return;
      }
      const parser = (SLDParser as any).default
        ? new (SLDParser as any).default()
        : new SLDParser();
      let sld = getSld(currentLayer);
      let sldObject: GeoStylerStyle;
      if (!sld) {
        let layerStyle = currentLayer.getStyle();
        if (typeof layerStyle == 'function') {
          layerStyle = <Style | Style[]>layerStyle(new Feature(), 1);
        }
        const symbolizers = new OlStyleParser().getSymbolizersFromOlStyle(
          Array.isArray(layerStyle) ? layerStyle : [layerStyle],
        );
        sldObject = {
          name: '',
          rules: [
            {
              name: '',
              symbolizers,
            },
          ],
        };
      } else {
        sldObject = (await parser.readStyle(sld)).output;
      }

      //In case SLD was not valid for parser, create a new one from default style
      if (!sldObject) {
        sld = defaultStyle;
        sldObject = (await parser.readStyle(sld)).output;
      }
      this.fixOpacity(sldObject);
      const legendOpts: any = {
        styles: [sldObject],
        size: [300, 200],
        hideRect: true,
      };
      const legendRenderer = (LegendRenderer as any).default
        ? new (LegendRenderer as any).default(legendOpts)
        : new LegendRenderer(legendOpts);
      const el = document.createElement('div');
      await legendRenderer.render(el);
      return el.innerHTML;
    } catch (ex) {
      throw ex;
    }
  }

  private fixOpacity(sldObject: GeoStylerStyle) {
    for (const rule of sldObject.rules) {
      for (const symbol of rule.symbolizers) {
        if (symbol.kind == 'Fill' && symbol.fillOpacity && !symbol.opacity) {
          symbol.opacity = symbol.fillOpacity;
        }
      }
    }
  }

  /**
   * Generate url for GetLegendGraphic request of WMS service for selected layer
   * @param source - Source of wms layer
   * @param layer_name - Name of layer for which legend is requested
   * @param layer - Layer to get legend for
   * @returns Url of the legend graphics
   */
  getLegendUrl(
    source: Source,
    layer_name: string,
    layer: Layer<Source>,
  ): string {
    if (!this.hsLayerUtilsService.isLayerWMS(layer)) {
      return '';
    }
    const params = this.hsLayerUtilsService.getLayerParams(layer);
    const version = params.VERSION || '1.3.0';
    let source_url = this.hsLayerUtilsService.getURL(layer);
    if (source_url.indexOf('proxy4ows') > -1) {
      const params = this.hsUtilsService.getParamsFromUrl(source_url);
      source_url = params.OWSURL;
    }
    const legendImage = getLegends(layer);
    if (
      legendImage === undefined ||
      (Array.isArray(legendImage) && legendImage.length == 0)
    ) {
      source_url +=
        (source_url.indexOf('?') > 0 ? '' : '?') +
        '&version=' +
        version +
        '&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=' +
        layer_name +
        '&format=image%2Fpng';
      if (
        getEnableProxy(layer) === undefined ||
        getEnableProxy(layer) == true
      ) {
        source_url = this.hsUtilsService.proxify(source_url);
      }
      return source_url;
    } else {
      if (typeof legendImage == 'string') {
        return legendImage;
      }
      if (Array.isArray(legendImage)) {
        return legendImage[0];
      }
    }
  }

  async setSvg(layer: Layer<Source>): Promise<SafeHtml> {
    return this.sanitizer.bypassSecurityTrustHtml(
      await this.getVectorLayerLegendSvg(layer as VectorLayer<VectorSource>),
    );
  }

  /**
   * Generate SVG linear gradient for layers colormap
   */
  generateInterpolatedLayerLegend(layer: Layer<any>) {
    return {
      autoLegend: true,
      title: getTitle(layer),
      lyr: layer,
      type: 'vector',
      visible: layer.getVisible(),
      svg: this.hsStylerService.generateSVGGradientForColorMap(layer),
    };
  }

  /**
   * (PRIVATE) Generate url for GetLegendGraphic request of WMS service for selected layer
   * @param layer - OpenLayers layer
   * @returns Description of layer to be used for creating the legend. It contains type of layer, sublayer legends, title, visibility etc.
   */
  async getLayerLegendDescriptor(
    layer: Layer<Source>,
  ): Promise<HsLegendDescriptor | undefined> {
    if (getBase(layer)) {
      return;
    }
    if (this.hsLayerUtilsService.isLayerWMS(layer)) {
      const subLayerLegends = this.hsLayerUtilsService
        .getLayerParams(layer)
        .LAYERS?.split(',');
      for (let i = 0; i < subLayerLegends.length; i++) {
        subLayerLegends[i] = this.getLegendUrl(
          layer.getSource(),
          subLayerLegends[i],
          layer,
        );
      }
      return {
        title: getTitle(layer),
        lyr: layer,
        type: 'wms',
        subLayerLegends: subLayerLegends,
        visible: layer.getVisible(),
      };
    } else if (
      this.hsUtilsService.instOf(layer, VectorLayer) &&
      (getShowInLayerManager(layer) === undefined ||
        getShowInLayerManager(layer) == true)
    ) {
      return {
        autoLegend: getAutoLegend(layer) ?? true,
        title: getTitle(layer),
        lyr: layer,
        type: 'vector',
        visible: layer.getVisible(),
        svg: await this.setSvg(layer),
      };
    } else if (
      this.hsUtilsService.instOf(layer, ImageLayer) &&
      this.hsUtilsService.instOf(layer.getSource(), Static)
    ) {
      return {
        title: getTitle(layer),
        lyr: layer,
        type: 'static',
        visible: layer.getVisible(),
      };
    } else if (this.hsUtilsService.instOf(layer.getSource(), XYZ)) {
      return {
        title: getTitle(layer),
        lyr: layer,
        type: 'static',
        visible: layer.getVisible(),
      };
    } else if (
      this.hsUtilsService.instOf(layer.getSource(), InterpolatedSource)
    ) {
      return this.generateInterpolatedLayerLegend(layer);
    } else {
      return undefined;
    }
  }
}
