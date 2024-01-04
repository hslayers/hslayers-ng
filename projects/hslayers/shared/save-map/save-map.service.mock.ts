export class HsSaveMapServiceMock {
  internalLayers = [];
  constructor() {}
  serializeStyle(s: any): any {
    const o: any = {};
    if (s.getFill() && s.getFill() !== null) {
      o.fill = s.getFill().getColor();
    }
    if (s.getStroke() && s.getStroke() !== null) {
      o.stroke = {
        color: s.getStroke().getColor(),
        width: s.getStroke().getWidth(),
      };
    }
    if (s.getImage() && s.getImage() !== null) {
      const style_img = s.getImage();
      const ima: any = {};
      if (
        style_img.getFill &&
        style_img.getFill() &&
        style_img.getFill() !== null
      ) {
        ima.fill = style_img.getFill().getColor();
      }

      if (
        style_img.getStroke &&
        style_img.getStroke() &&
        style_img.getStroke() !== null
      ) {
        ima.stroke = {
          color: style_img.getStroke().getColor(),
          width: style_img.getStroke().getWidth(),
        };
      }

      if (style_img.getRadius) {
        ima.radius = style_img.getRadius();
      }
      o.image = ima;
    }
    return o;
  }
}
