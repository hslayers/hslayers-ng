import {Circle, Fill, Stroke, Style} from 'ol/style';

export const defaultStyle = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name/>
    <UserStyle>
      <Title/>
      <FeatureTypeStyle>
        <Rule>
          <Name/>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#FFFFFF</CssParameter>
                  <CssParameter name="fill-opacity">0.41</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#0099ff</CssParameter>
                  <CssParameter name="stroke-width">1.25</CssParameter>
                </Stroke>
              </Mark>
              <Size>10</Size>
            </Graphic>
          </PointSymbolizer>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill-opacity">0.45</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#0099ff</CssParameter>
              <CssParameter name="stroke-width">1.25</CssParameter>
              <CssParameter name="stroke-opacity">0.3</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#0099ff</CssParameter>
              <CssParameter name="stroke-width">1.25</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

export const simple_style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 1)',
  }),
  stroke: new Stroke({
    color: '#ffcc33',
    width: 1,
  }),
  image: new Circle({
    radius: 7,
    fill: new Fill({
      color: '#ffcc33',
    }),
  }),
});
