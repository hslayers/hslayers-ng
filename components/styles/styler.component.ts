import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Component} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsSaveMapService} from '../save-map/save-map.service';
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
  imagetype = this.imagetypes[2].name;
  radius = 5;
  linewidth = 2;
  iconlinewidth = 1;
  iconimage: any;
  fillcolor: any;
  linecolor: any;
  iconfillcolor: any;
  iconlinecolor: any;
  serialized_icon: any;
  layerTitle: string;
  level: 'feature' | 'cluster' | 'layer' = 'layer';
  isClustered: boolean;
  hasFeatures: boolean;
  constructor(
    public HsStylerService: HsStylerService,
    public HsLayoutService: HsLayoutService,
    private http: HttpClient,
    public HsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsUtilsService: HsUtilsService,
    private HsStylerColorService: HsStylerColorService,
    private HsSaveMapService: HsSaveMapService
  ) {
    this.HsEventBusService.layerSelectedFromUrl.subscribe((layerFound) => {
      if (layerFound !== null) {
        this.HsStylerService.layer = layerFound;
        this.resolveLayerStyle();
      }
    });
    this.HsEventBusService.mainPanelChanges.subscribe((e) => {
      if (e == 'styler') {
        if (!this.icons) {
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
          ].map((icon) =>
            this.sanitizer.bypassSecurityTrustResourceUrl(
              this.HsUtilsService.resolveEsModule(icon)
            )
          );
          this.resolveLayerStyle();
        }
      }
    });
  }
  resolveLayerStyle(): void {
    this.isClustered = this.HsLayerUtilsService.isLayerClustered(
      this.HsStylerService.layer
    );
    this.hasFeatures = this.HsStylerService.hasFeatures(
      this.HsStylerService.layer,
      this.isClustered
    );
    this.refreshLayerDefinition();
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
    switch (this.level) {
      case 'feature':
        this.setStyleForFeatures(layer, style);
        break;
      case 'cluster':
        let newClusterStroke: Stroke;
        let newClusterFill: Fill;
        if (
          this.iconlinecolor !== undefined &&
          this.iconlinewidth !== undefined &&
          this.iconfillcolor !== undefined
        ) {
          newClusterStroke = new Stroke({
            color: this.iconlinecolor['background-color'],
            width: this.iconlinewidth,
          });
          newClusterFill = new Fill({
            color: this.iconfillcolor['background-color'],
          });
        }
        this.HsStylerService.clusterStyle.setFill(
          newClusterFill !== undefined ? newClusterFill : layer.getFill()
        );
        this.HsStylerService.clusterStyle.setStroke(
          newClusterStroke !== undefined ? newClusterStroke : layer.getStroke()
        );
        this.HsStylerService.styleClusteredLayer(this.HsStylerService.layer);
        break;
      default:
      case 'layer':
        this.setStyleForFeatures(layer, null);
        if (this.isClustered) {
          /* hsOriginalStyle is used only for cluster layers 
          when styling clusters with just one feature in it */
          this.HsStylerService.layer.set('hsOriginalStyle', style);
        } else {
          layer.setStyle(style);
        }
        this.HsStylerService.newLayerStyleSet.next(layer);
        break;
    }
    if (this.isClustered) {
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
    const underlyingSource = this.HsStylerService.getLayerSource(
      layer,
      this.isClustered
    );
    /**
     * We set a blank VectorSource temporarily
     * to disable change event broadcasting and linked
     * repainting on each call of setStyle for all features.
     */
    (this.isClustered ? layer.getSource() : layer).setSource(
      new VectorSource()
    );
    for (const f of underlyingSource.getFeatures()) {
      f.setStyle(style);
    }
    (this.isClustered ? layer.getSource() : layer).setSource(underlyingSource);
    this.HsStylerService.newFeatureStyleSet.next(layer);
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
        'data:image/svg+xml;base64,' +
        this.HsStylerService.encodeTob64(iconPreview.innerHTML);
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
    if (
      this.HsStylerService.layer === undefined ||
      this.HsStylerService.layer === null
    ) {
      return;
    }
    this.readCurrentStyle(this.HsStylerService.layer);
    this.layerTitle = this.HsStylerService.layer.get('title');
  }
  readCurrentStyle(layer: VectorLayer): void {
    const resolvedStyle = this.HsStylerService.getLayerStyleObject(
      layer,
      this.isClustered
    );
    if (
      resolvedStyle !== undefined &&
      this.HsUtilsService.instOf(resolvedStyle, Style)
    ) {
      this.parseStyles(resolvedStyle);
    }
  }

  private parseStyles(resolvedStyle: Style | Style[]) {
    if (Array.isArray(resolvedStyle)) {
      for (const subStyle of resolvedStyle) {
        this.parseStyle(subStyle);
      }
    } else {
      this.parseStyle(resolvedStyle);
    }
  }

  private parseStyle(style: Style) {
    const subStyle: Style = this.HsSaveMapService.serializeStyle(style);
    if (subStyle.stroke?.color) {
      this.linecolor = this.HsStylerColorService.findAndParseColor(
        subStyle.stroke.color
      );
    }
    if (subStyle.stroke?.width) {
      this.linewidth = subStyle.stroke.width;
    }
    if (subStyle.fill) {
      this.fillcolor = this.HsStylerColorService.findAndParseColor(
        subStyle.fill
      );
    }
    if (subStyle.image) {
      const imageStyle = this.HsStylerService.getImageStyle(subStyle.image);
      if (!imageStyle || imageStyle === undefined) {
        return;
      }
      if (imageStyle.icon !== undefined) {
        this.setStylerValues(imageStyle.icon);
        if (imageStyle.icon.iconimage) {
          this.iconimage = imageStyle.icon.iconimage;
        }
        if (imageStyle.icon.serialized_icon) {
          this.serialized_icon = imageStyle.icon.serialized_icon;
        }
        this.setImageType('icon');
      }
      if (imageStyle.circle !== undefined) {
        this.setStylerValues(imageStyle.circle);
        if (imageStyle.circle?.radius) {
          this.radius = imageStyle.circle.radius;
        }
      }
    }
  }
  setStylerValues(style: any): void {
    if (style.iconlinecolor) {
      this.iconlinecolor = this.HsStylerColorService.findAndParseColor(
        style.iconlinecolor
      );
    }
    if (style.iconfillcolor) {
      this.iconfillcolor = this.HsStylerColorService.findAndParseColor(
        style.iconfillcolor
      );
    }
    if (style.iconlinewidth) {
      this.iconlinewidth = style.iconlinewidth;
    }
  }
}
