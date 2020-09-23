import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Component} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsStylerColorService} from './styler-color.service';
import {HsStylerService} from '../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';

type StyleJson = {
  fill?: any;
  stroke?: any;
  image?: any;
  radius?: any;
};

@Component({
  selector: 'hs-styles',
  template: require('./partials/styler.html'),
})
export class HsStylerComponent {
  icons: any;
  imagetypes: string[] = ['none', 'icon', 'circle'];
  imagetype = this.imagetypes[2];
  radius = 5;
  linewidth = 2;
  iconlinewidth = 1;
  iconimage: any;
  fillcolor: any;
  linecolor: any;
  iconfillcolor: any;
  iconlinecolor: any;
  serialized_icon: any;
  hasLine: any;
  hasPoly: any;
  hasPoint: any;
  layerTitle: string;
  level: 'feature' | 'layer' = 'layer';

  constructor(
    private HsStylerService: HsStylerService,
    private HsLayoutService: HsLayoutService,
    private http: HttpClient,
    private HsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsUtilsService: HsUtilsService,
    private HsStylerColorService: HsStylerColorService
  ) {
    this.HsEventBusService.mainPanelChanges.subscribe((e) => {
      if (this.HsLayoutService.mainpanel == 'styler' && !this.icons) {
        this.icons = [
          require(/* webpackChunkName: "img" */ './img/svg/bag1.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/banking4.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/bar.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/beach17.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/bicycles.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/building103.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/bus4.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/cabinet9.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/camping13.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/caravan.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/church15.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/church1.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/coffee-shop1.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/disabled.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/favourite28.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/football1.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/footprint.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/gift-shop.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/gps40.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/gps41.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/gps42.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/gps43.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/gps5.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/hospital.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/hot-air-balloon2.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/information78.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/library21.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/location6.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/luggage13.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/monument1.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/mountain42.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/museum35.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/park11.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/parking28.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/pharmacy17.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/port2.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/restaurant52.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/road-sign1.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/sailing-boat2.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/ski1.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/swimming26.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/telephone119.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/toilets2.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/train-station.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/university2.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/warning.svg'),
          require(/* webpackChunkName: "img" */ './img/svg/wifi8.svg'),
        ].map((icon) => this.sanitizer.bypassSecurityTrustResourceUrl(icon));
      }
      this.refreshLayerDefinition();
    });
  }

  toDecimal2(n: number) {
    return Math.round(n * 100) / 100;
  }

  debounceSave() {
    this.HsUtilsService.debounce(
      () => {
        this.save();
      },
      200,
      false,
      this
    )();
  }

  async save(): Promise<void> {
    if (!this.HsStylerService.layer) {
      return;
    }
    if (this.imagetype == 'icon') {
      // When no icon is selected yet, then pick one randomly
      if (this.iconimage === undefined || this.iconimage === null) {
        const randomIconIdx = Math.floor(Math.random() * this.icons.length);
        this.iconSelected(this.icons[randomIconIdx]);
      }
    }
    const style_json: StyleJson = {};
    //FILL
    if (this.fillcolor !== undefined) {
      style_json.fill = new Fill({
        color: this.fillcolor['background-color'],
      });
    } else {
      style_json.fill = new Fill({
        color: 'rgb(0,0,255)',
      });
    }
    //STROKE WIDTH
    if (
      this.linecolor !== undefined &&
      this.linecolor !== null &&
      this.linewidth > 0
    ) {
      style_json.stroke = new Stroke({
        color: this.linecolor['background-color'],
        width: this.linewidth !== undefined ? this.linewidth : 1,
      });
    } else {
      style_json.stroke = new Stroke({
        color: 'rgb(44,0,200)',
        width: this.linewidth !== undefined ? this.linewidth : 1,
      });
    }
    //
    if (this.imagetype != 'none') {
      style_json.image = null;
      if (
        this.imagetype == 'circle' &&
        (this.iconfillcolor !== undefined || this.iconlinecolor !== undefined)
      ) {
        const circle_json: StyleJson = {
          radius: this.radius !== undefined ? this.toDecimal2(this.radius) : 5,
        };
        if (this.iconfillcolor !== undefined && this.iconfillcolor !== null) {
          circle_json.fill = new Fill({
            color: this.iconfillcolor['background-color'],
          });
        }
        if (
          this.iconlinecolor !== undefined &&
          this.iconlinecolor !== null &&
          this.iconlinewidth > 0
        ) {
          circle_json.stroke = new Stroke({
            color: this.iconlinecolor['background-color'],
            width: this.iconlinewidth,
          });
        }
        style_json.image = new Circle(circle_json);
      }
      if (this.imagetype == 'icon' && this.serialized_icon !== undefined) {
        const img = await this.loadImage(this.serialized_icon);
        const icon_json = {
          img: img,
          imgSize: [img.width, img.height],
          anchor: [0.5, 1],
          crossOrigin: 'anonymous',
        };
        style_json.image = new Icon(icon_json);
      }
    }
    if (
      style_json.fill !== undefined ||
      style_json.stroke !== undefined ||
      style_json.image !== undefined
    ) {
      this.setStyleByJson(style_json);
    }
  }

  loadImage(src): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (err) => reject(err));
      img.src = src;
    });
  }

  setStyleByJson(style_json: StyleJson): void {
    const style = new Style(style_json);
    const layer = this.HsStylerService.layer;
    const isClustered = this.HsLayerUtilsService.isLayerClustered(layer);
    switch (this.level) {
      case 'feature':
        this.setStyleForFeatures(layer, style);
        break;
      case 'layer':
      default:
        this.setStyleForFeatures(layer, null);
        if (isClustered) {
          /* hsOriginalStyle is used only for cluster layers 
          when styling clusters with just one feature in it */
          this.HsStylerService.layer.set('hsOriginalStyle', style);
        } else {
          layer.setStyle(style);
        }
        break;
    }
    if (isClustered) {
      this.repaintCluster(layer);
    }
  }

  /**
   * Force repainting of clusters by reapplying cluster style which
   * was created in cluster method
   *
   * @param {VectorLayer} layer Vector layer
   */
  repaintCluster(layer: VectorLayer): void {
    layer.setStyle(layer.getStyle());
  }

  /**
   * Sets style for all features in a given layer.
   * For cluster layers the style is set for underlying sources features.
   *
   * @param {VectorLayer} layer Layer for whose features is the style set.
   * @param {StyleLike|null} style Style to set for the feature. Can be null
   */
  private setStyleForFeatures(layer: VectorLayer, style: Style | null): void {
    const isClustered = this.HsLayerUtilsService.isLayerClustered(layer);
    const underlyingSource = this.HsStylerService.getLayerSource(layer);
    /**
     * We set a blank VectorSource temporarily
     * to disable change event broadcasting and linked
     * repainting on each call of setStyle for all features.
     */
    (isClustered ? layer.getSource() : layer).setSource(new VectorSource());
    for (const f of underlyingSource.getFeatures()) {
      f.setStyle(style);
    }
    (isClustered ? layer.getSource() : layer).setSource(underlyingSource);
  }

  /**
   * @function iconSelected
   * @memberof HsStylerComponent
   * @param {SafeResourceUrl} i Sanitized icon resource
   * @description Load selected SVG icon and use it for layer
   */
  iconSelected(i: SafeResourceUrl): void {
    const headers = new HttpHeaders();
    headers.set('Accept', 'image/svg+xml');
    this.http
      .get(i['changingThisBreaksApplicationSecurity'], {
        headers,
        responseType: 'text',
      })
      .subscribe((response) => {
        this.iconimage = this.sanitizer.bypassSecurityTrustHtml(response);
        //Timeout is needed even in angular 9, because svg is loaded on
        // next digest and used in marker generation
        setTimeout(() => {
          this.colorIcon();
          this.save();
        }, 0);
      });
  }

  /**
   * @function colorIcon
   * @memberof HsStylerComponent
   * @description Change colors of selected icon based on user input. Decode modified icon into Base-64
   */
  colorIcon(): void {
    const iconPreview = document.getElementsByClassName(
      'hs-styler-selected-icon-box'
    )[0];
    const svgPath: any = iconPreview.querySelectorAll('path');
    for (const path of svgPath) {
      if (!path) {
        return;
      }
      if (this.iconfillcolor !== undefined && this.iconfillcolor !== null) {
        path.style.fill = this.iconfillcolor['background-color'];
      }
      if (this.iconlinecolor !== undefined && this.iconlinecolor !== null) {
        path.style.stroke = this.iconlinecolor['background-color'];
      }
      if (this.iconlinewidth !== undefined && this.iconlinewidth !== null) {
        path.style.strokeWidth = this.iconlinewidth;
      }
      this.serialized_icon =
        'data:image/svg+xml;base64,' + window.btoa(iconPreview.innerHTML);
    }
  }
  /**
   * @function setImageType
   * @memberof HsStylerComponent
   * @param {string} t New image type
   * @description Change image type for point geometry and redraw style
   */
  setImageType(t: string): void {
    this.imagetype = t;
    this.save();
  }

  layermanager(): void {
    this.HsLayoutService.setMainPanel('layermanager');
  }

  /**
   * @function refreshLayerDefinition
   * @memberof HsStylerComponent
   * @description (PRIVATE) Get geometry type and title for selected layer
   */
  refreshLayerDefinition(): void {
    if (this.HsStylerService.layer === null) {
      return;
    }
    const src: any = this.HsStylerService.getLayerSource(
      this.HsStylerService.layer
    );
    if (
      this.HsStylerService.layer === undefined ||
      this.HsStylerService.layer === null
    ) {
      return;
    }
    this.calculateHasLinePointPoly(src);
    this.readCurrentStyle(this.HsStylerService.layer);
    this.hasLine = src.hasLine;
    this.hasPoly = src.hasPoly;
    this.hasPoint = src.hasPoint;
    this.layerTitle = this.HsStylerService.layer.get('title');
  }

  readCurrentStyle(layer: VectorLayer): void {
    let style = layer.getStyle();
    if (this.HsLayerUtilsService.isLayerClustered(layer)) {
      style = layer.get('hsOriginalStyle');
    }
    if (typeof style == 'function') {
      const resolvedStyle: Style | Style[] = style(new Feature());
      this.parseStyles(resolvedStyle);
    } else if (this.HsUtilsService.instOf(style, Style)) {
      this.parseStyle(style);
    }
  }

  private parseStyles(resolvedStyle: Style | Style[]) {
    if (Array.isArray(resolvedStyle)) {
      for (const subStyle of resolvedStyle) {
        this.parseStyle(subStyle);
      }
    } else if (this.HsUtilsService.instOf(resolvedStyle, Style)) {
      this.parseStyle(resolvedStyle);
    }
  }

  private parseStyle(subStyle: Style) {
    if (subStyle.getStroke()?.getColor()) {
      this.linecolor = this.HsStylerColorService.findAndParseColor(
        subStyle.getStroke().getColor()
      );
    }
    if (subStyle.getFill()?.getColor()) {
      this.fillcolor = this.HsStylerColorService.findAndParseColor(
        subStyle.getFill().getColor()
      );
    }
    if (subStyle.image) {
      if (subStyle.image.getStroke()?.getColor()) {
        this.iconlinecolor = this.HsStylerColorService.findAndParseColor(
          subStyle.getStroke().getColor()
        );
      }
      if (subStyle.image.getFill()?.getColor()) {
        this.iconfillcolor = this.HsStylerColorService.findAndParseColor(
          subStyle.getFill().getColor()
        );
      }
    }
  }

  /**
   * @function calculateHasLinePointPoly
   * @memberof HsStylerComponent
   * @private
   * @description (PRIVATE) Calculate vector type if not specified in layer metadata
   * @param src
   */
  calculateHasLinePointPoly(src): void {
    src.hasLine = false;
    src.hasPoly = false;
    src.hasPoint = false;
    src.getFeatures().forEach((f) => {
      if (f.getGeometry()) {
        switch (f.getGeometry().getType()) {
          case 'LineString' || 'MultiLineString':
            src.hasLine = true;
            break;
          case 'Polygon' || 'MultiPolygon':
            src.hasPoly = true;
            break;
          case 'Circle':
            src.hasPoly = true;
            break;
          case 'Point' || 'MultiPoint':
            src.hasPoint = true;
            break;
          // no default
        }
      }
    });
  }
}
