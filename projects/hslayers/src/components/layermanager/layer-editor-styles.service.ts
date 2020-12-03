/* eslint-disable angular/definedundefined */
import {Circle, Fill, RegularShape, Stroke} from 'ol/style';
import {HsStylerService} from '../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorStylesService {
  constructor(
    public HsUtilsService: HsUtilsService,
    public HsStylerService: HsStylerService
  ) {}
  changePointType(layer, type): void {
    if (layer.style == undefined) {
      this.getLayerStyle(layer);
    }
    layer.style.pointType = type;
    this.setLayerStyle(layer);
  }

  //TODO refactor to some style oriented helper service
  /**
   * @param wrapper
   */
  setLayerStyle(wrapper): void {
    const layer = wrapper.layer;
    const source = layer.getSource();
    const style = wrapper.style.style;
    if (source.hasPoly) {
      style.setFill(
        new Fill({
          color: wrapper.style.fillColor,
        })
      );
    }
    if (source.hasLine || source.hasPoly) {
      style.setStroke(
        new Stroke({
          color: wrapper.style.lineColor,
          width: wrapper.style.lineWidth,
        })
      );
    }
    if (source.hasPoint) {
      let image;
      const stroke = new Stroke({
        color: wrapper.style.pointStroke,
        width: wrapper.style.pointWidth,
      });
      const fill = new Fill({
        color: wrapper.style.pointFill,
      });
      if (wrapper.style.pointType === 'Circle') {
        image = new Circle({
          stroke: stroke,
          fill: fill,
          radius: wrapper.style.radius,
          rotation: wrapper.style.rotation,
        });
      }
      if (wrapper.style.pointType === 'Polygon') {
        image = new RegularShape({
          stroke: stroke,
          fill: fill,
          radius: wrapper.style.radius,
          points: wrapper.style.pointPoints,
          rotation: wrapper.style.rotation,
        });
      }
      if (wrapper.style.pointType === 'Star') {
        image = new RegularShape({
          stroke: stroke,
          fill: fill,
          radius1: wrapper.style.radius,
          radius2: wrapper.style.radius2,
          points: wrapper.style.pointPoints,
          rotation: wrapper.style.rotation,
        });
      }
      style.setImage(image);
    }
    layer.setStyle(style);
    this.HsStylerService.newLayerStyleSet.next(layer);
  }

  //TODO refactor to some style oriented helper service
  getLayerStyle(wrapper): void {
    const layer = wrapper.layer;
    const source = layer.getSource();
    wrapper.style = {};
    if (layer.getStyle === undefined) {
      return;
    }
    let style = this.HsStylerService.getLayerStyleObject(layer);
    if (style === undefined) {
      return;
    }
    style = style.clone();
    if (source.hasPoly) {
      wrapper.style.fillColor = style.getFill().getColor();
    }
    if (source.hasLine || source.hasPoly) {
      wrapper.style.lineColor = style.getStroke().getColor();
      wrapper.style.lineWidth = style.getStroke().getColor();
    }
    if (source.hasPoint) {
      const image = style.getImage();
      if (this.HsUtilsService.instOf(image, Circle)) {
        wrapper.style.pointType = 'Circle';
      } else if (this.HsUtilsService.instOf(image, RegularShape)) {
        wrapper.style.pointPoints = image.getPoints();
        wrapper.style.rotation = image.getRotation();
        if (image.getRadius2() == undefined) {
          wrapper.style.pointType = 'Polygon';
        } else {
          wrapper.style.pointType = 'Star';
          wrapper.style.radius2 = image.getRadius2();
        }
      }
      if (
        this.HsUtilsService.instOf(image, Circle) ||
        this.HsUtilsService.instOf(image, RegularShape)
      ) {
        wrapper.style.radius = image.getRadius();
        wrapper.style.pointFill = image.getFill().getColor();
        wrapper.style.pointStroke = image.getStroke().getColor();
        wrapper.style.pointWidth = image.getStroke().getWidth();
      }
      if (wrapper.style.radius2 == undefined) {
        wrapper.style.radius2 = wrapper.style.radius / 2;
      }
      if (wrapper.style.pointPoints == undefined) {
        wrapper.style.pointPoints = 4;
      }
      if (wrapper.style.rotation == undefined) {
        wrapper.style.rotation = Math.PI / 4;
      }
    }
    wrapper.style.style = style;
  }

  saveStyle(layer): void {
    this.setLayerStyle(layer);
  }
}
