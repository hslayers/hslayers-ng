export const sensorUnitStyle = 
  `
    <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"
        xmlns="http://www.opengis.net/sld"
        xmlns:ogc="http://www.opengis.net/ogc"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:se="http://www.opengis.net/se">
        <NamedLayer>
            <Name/>
            <UserStyle>
                <Name/>
                <Title/>
                <FeatureTypeStyle>
                    <Rule>
                        <Name>Senor unit style</Name>
                        <TextSymbolizer>
                            <Label>
                                <ogc:PropertyName>name</ogc:PropertyName>
                            </Label>
                            <Font>
                                <CssParameter name="font-size">12</CssParameter>
                                <CssParameter name="font-style">normal</CssParameter>
                                <CssParameter name="font-weight">normal</CssParameter>
                                <CssParameter name="font-family">Arial</CssParameter>
                            </Font>
                            <LabelPlacement>
                                <PointPlacement>
                                    <Displacement>
                                        <DisplacementX>0</DisplacementX>
                                        <DisplacementY>30</DisplacementY>
                                    </Displacement>
                                </PointPlacement>
                            </LabelPlacement>
                            <Halo>
                                <Radius>3</Radius>
                                <Fill>
                                    <CssParameter name="fill">#ffffff</CssParameter>
                                </Fill>
                            </Halo>
                            <Fill>
                                <CssParameter name="fill">#000</CssParameter>
                                <CssParameter name="fill-opacity">0.75</CssParameter>
                            </Fill>
                        </TextSymbolizer>
                        <PointSymbolizer>
                            <Graphic>
                                <ExternalGraphic>
                                    <OnlineResource xlink:type="simple"
                                        xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="assets/hslayers-ng/img/icons/wifi8.svg"/>
                                </ExternalGraphic>
                            </Graphic>
                        </PointSymbolizer>
                    </Rule>
                </FeatureTypeStyle>
            </UserStyle>
        </NamedLayer>
    </StyledLayerDescriptor>
  `
