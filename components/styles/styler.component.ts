import {Component} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsStylerService} from '../styles/styler.service';

import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Layer} from 'ol/layer';

type styleJson = {
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
  imagetypes: Array<any> = [
    {
      name: 'none',
      hrname: 'None',
    },
    {
      name: 'icon',
      hrname: 'Icon',
    },
    {
      name: 'circle',
      hrname: 'Circle',
    },
  ];
  imagetype = this.imagetypes[0].name;
  radius = 5;
  linewidth = 2;
  iconlinewidth = 2;
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

  constructor(
    private HsStylerService: HsStylerService,
    private HsLayoutService: HsLayoutService,
    private http: HttpClient,
    private HsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer
  ) {
    this.HsEventBusService.mainPanelChanges.subscribe((e) => {
      if (this.HsLayoutService.mainpanel == 'styler' && !this.icons) {
        this.icons = [
          require('./img/svg/bag1.svg'),
          require('./img/svg/banking4.svg'),
          require('./img/svg/bar.svg'),
          require('./img/svg/beach17.svg'),
          require('./img/svg/bicycles.svg'),
          require('./img/svg/building103.svg'),
          require('./img/svg/bus4.svg'),
          require('./img/svg/cabinet9.svg'),
          require('./img/svg/camping13.svg'),
          require('./img/svg/caravan.svg'),
          require('./img/svg/church15.svg'),
          require('./img/svg/church1.svg'),
          require('./img/svg/coffee-shop1.svg'),
          require('./img/svg/disabled.svg'),
          require('./img/svg/favourite28.svg'),
          require('./img/svg/football1.svg'),
          require('./img/svg/footprint.svg'),
          require('./img/svg/gift-shop.svg'),
          require('./img/svg/gps40.svg'),
          require('./img/svg/gps41.svg'),
          require('./img/svg/gps42.svg'),
          require('./img/svg/gps43.svg'),
          require('./img/svg/gps5.svg'),
          require('./img/svg/hospital.svg'),
          require('./img/svg/hot-air-balloon2.svg'),
          require('./img/svg/information78.svg'),
          require('./img/svg/library21.svg'),
          require('./img/svg/location6.svg'),
          require('./img/svg/luggage13.svg'),
          require('./img/svg/monument1.svg'),
          require('./img/svg/mountain42.svg'),
          require('./img/svg/museum35.svg'),
          require('./img/svg/park11.svg'),
          require('./img/svg/parking28.svg'),
          require('./img/svg/pharmacy17.svg'),
          require('./img/svg/port2.svg'),
          require('./img/svg/restaurant52.svg'),
          require('./img/svg/road-sign1.svg'),
          require('./img/svg/sailing-boat2.svg'),
          require('./img/svg/ski1.svg'),
          require('./img/svg/swimming26.svg'),
          require('./img/svg/telephone119.svg'),
          require('./img/svg/toilets2.svg'),
          require('./img/svg/train-station.svg'),
          require('./img/svg/university2.svg'),
          require('./img/svg/warning.svg'),
          require('./img/svg/wifi8.svg'),
        ];
      }
      this.updateHasVectorFeatures();
    });
  }

  /**
   * @function save
   * @memberof hs.styler.controller
   * @description Get current style variables value and style current layer accordingly
   * @param {Layer} layer
   */
  getLayerSource(layer: Layer) {
    let src = [];
    if (layer.getSource().getSource !== undefined) {
      src = layer.getSource().getSource();
    } else {
      src = layer.getSource();
    }
    return src;
  }

  toDecimal2(n: number) {
    return Math.round(n * 100) / 100;
  }

  save(): void {
    if (!this.HsStylerService.layer) {
      return;
    }
    if (this.imagetype == 'icon') {
      this.colorIcon();
    }
    const source: any = this.getLayerSource(this.HsStylerService.layer);
    const style_json: styleJson = {};
    //FILL
    if (this.fillcolor !== undefined && this.fillcolor !== null) {
      style_json.fill = new Fill({
        color: this.fillcolor['background-color'],
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
    }
    //
    if (this.imagetype != 'none') {
      if (
        this.imagetype == 'circle' &&
        (this.iconfillcolor !== undefined || this.iconlinecolor !== undefined)
      ) {
        const circle_json: styleJson = {
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
          this.iconlinewidth !== undefined &&
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
        const img = new Image();
        img.src = this.serialized_icon;
        img.onload = () => {
          const icon_json = {
            img: img,
            imgSize: [img.width, img.height],
            anchor: [0.5, 1],
            crossOrigin: 'anonymous',
          };
          style_json.image = new Icon(icon_json);
          source.getFeatures().forEach((f) => {
            f.setStyle(null);
          });
          this.HsStylerService.layer.setStyle(new Style(style_json));
        };
      }
    }
    if (
      style_json.fill !== undefined ||
      style_json.stroke !== undefined ||
      style_json.image !== undefined
    ) {
      const style = new Style(style_json);
      source.getFeatures().forEach((f) => {
        f.setStyle(null);
      });
      this.HsStylerService.layer.setStyle(style);
    }
  }

  /**
   * @function iconSelected
   * @memberof hs.styler.controller
   * @param {string} i Icon name
   * @description Load selected SVG icon from folder and use it for layer
   */
  iconSelected(i: string): void {
    const headers = new HttpHeaders();
    headers.set('Accept', 'image/svg+xml');
    this.http
      .get('' + i, {headers, responseType: 'text'})
      .subscribe((response) => {
        this.iconimage = this.sanitizer.bypassSecurityTrustHtml(response);
        setTimeout(() => {
          this.colorIcon();
          this.save();
        }, 0);
      });
  }

  /**
   * @function colorIcon
   * @memberof hs.styler.controller
   * @description Change colors of selected icon based on user input. Decode modifyied icon into Base-64
   */
  colorIcon(): void {
    const iconPreview = document.getElementsByClassName(
      'hs-styler-selected-icon-box'
    )[0];
    const svgPath: any = iconPreview.querySelector('path');
    if (!svgPath) {
      return;
    }
    if (this.iconfillcolor !== undefined && this.iconfillcolor !== null) {
      svgPath.style.fill = this.iconfillcolor['background-color'];
    }
    if (this.iconlinecolor !== undefined && this.iconlinecolor !== null) {
      svgPath.style.stroke = this.iconlinecolor['background-color'];
    }
    if (this.iconlinewidth !== undefined && this.iconlinewidth !== null) {
      svgPath.style.strokeWidth = this.iconlinewidth;
    }
    this.serialized_icon =
      'data:image/svg+xml;base64,' + window.btoa(iconPreview.innerHTML);
  }

  /**
   * @function setImageType
   * @memberof hs.styler.controller
   * @params {string} t New image type
   * @description Change image type for point geometry and redraw style
   * @param t
   */
  setImageType(t): void {
    this.imagetype = t;
    this.save();
  }

  layermanager(): void {
    this.HsLayoutService.setMainPanel('layermanager');
  }

  /**
   * @function updateHasVectorFeatures
   * @memberof hs.styler.controller
   * @description (PRIVATE) Get geometry type and title for selected layer
   */
  updateHasVectorFeatures(): void {
    if (this.HsStylerService.layer === null) {
      return;
    }
    const src: any = this.getLayerSource(this.HsStylerService.layer);
    if (
      this.HsStylerService.layer === undefined ||
      this.HsStylerService.layer === null
    ) {
      return;
    }
    this.calculateHasLinePointPoly(src);
    this.hasLine = src.hasLine;
    this.hasPoly = src.hasPoly;
    this.hasPoint = src.hasPoint;
    this.layerTitle = this.HsStylerService.layer.get('title');
  }

  /**
   * @function calculateHasLinePointPoly
   * @memberof hs.styler.controller
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
