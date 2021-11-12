import {Component, Input, OnInit, ViewRef} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {
  HsDialogComponent,
  HsDialogContainerService,
  HsLayerUtilsService,
  HsMapService,
  HsStylerService,
  getTitle,
  setSld,
} from 'hslayers-ng';
import {Usage} from './statistics.service';
import {max, min} from 'simple-statistics';

@Component({
  selector: 'hs-to-map',
  templateUrl: './to-map-dialog.component.html',
})
export class HsStatisticsToMapDialogComponent
  implements HsDialogComponent, OnInit {
  @Input() data: {
    rows: any[];
    columns: string[];
    uses: Usage;
  };
  viewRef: ViewRef;
  vectorLayers = [];
  selectedLayer: {
    layer: VectorLayer<VectorSource<Geometry>>;
    title: string;
  };
  selectedVariable: string;
  selectedTimeValue: any;
  timeValues: any[];
  timeColumn: string;
  min: number;
  max: number;
  filteredRows: number[];
  locationColumn: string;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    private HsMapService: HsMapService,
    private HsStylerService: HsStylerService
  ) {
    this.fillVectorLayers();
  }
  ngOnInit(): void {
    this.timeColumn = this.data.columns.find(
      (col) => this.data.uses[col] == 'time'
    );
    this.locationColumn = this.data.columns.find(
      (col) => this.data.uses[col] == 'location'
    );
    this.timeValues = this.data.rows
      .map((row) => row[this.timeColumn])
      .filter((value) => value != undefined)
      .filter((value, index, self) => {
        //Return only unique items https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
        return self.indexOf(value) === index;
      });
    this.selectVariable(
      this.data.columns.find((col) => this.data.uses[col] == 'variable')
    );
    if (this.timeValues?.length > 0) {
      this.selectFilter(this.timeValues[this.timeValues.length - 1]);
    }
  }

  async fillVectorLayers(): Promise<void> {
    this.HsMapService.loaded().then((map) => {
      this.vectorLayers = [
        ...this.HsMapService.getLayersArray()
          .filter((layer: Layer<Source>) =>
            this.HsLayerUtilsService.isLayerDrawable(layer)
          )
          .map((layer: VectorLayer<VectorSource<Geometry>>) => {
            return {layer, title: getTitle(layer)};
          }),
      ];
      if (this.vectorLayers.length > 0) {
        this.selectLayer(this.vectorLayers[0]);
      }
    });
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }

  async selectLayer(layer: {
    layer: VectorLayer<VectorSource<Geometry>>;
    title: string;
  }): Promise<void> {
    this.selectedLayer = layer;
  }

  selectVariable(variable): void {
    this.selectedVariable = variable;
    this.applyFilters();
  }

  selectFilter(value: any): void {
    this.selectedTimeValue = value;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredRows = this.data.rows.filter(
      (row) => row[this.timeColumn] == this.selectedTimeValue
    );
    const filteredValues = this.filteredRows.map((row) =>
      parseFloat(row[this.selectedVariable])
    );
    this.min = min(filteredValues);
    this.max = max(filteredValues);
  }

  async visualize(): Promise<void> {
    const features = this.selectedLayer.layer.getSource().getFeatures();
    for (const row of this.filteredRows) {
      const feature = features.find(
        (feature) => feature.get('LABEL') == row[this.locationColumn]
      );
      if (feature) {
        feature.set('value', parseFloat(row[this.selectedVariable]));
      }
    }

    const rules = [];
    const palette = [
      '#a52344',
      '#ac2e35',
      '#af3d24',
      '#ad4e0d',
      '#a75e00',
      '#9c6e00',
      '#8d7d00',
      '#798c00',
      '#5f9900',
      '#35a523',
    ];
    const step = (this.max - this.min) / 10.0;
    for (let i = 0; i < 10; i++) {
      rules.push(`<Rule>
      <Name>class${i}</Name>
      <Filter xmlns="http://www.opengis.net/ogc">
        <And>
          <PropertyIsGreaterThanOrEqualTo>
            <PropertyName>value</PropertyName>
            <Literal>${this.min + step * i}</Literal>
          </PropertyIsGreaterThanOrEqualTo>
          <PropertyIsLessThan>
            <PropertyName>value</PropertyName>
            <Literal>${this.min + step * (i + 1)}</Literal>
          </PropertyIsLessThan>
        </And>
      </Filter>
      <PolygonSymbolizer>
        <Fill>
          <CssParameter name="fill">${palette[i]}</CssParameter>
          <CssParameter name="fill-opacity">1</CssParameter>
        </Fill>
        <Stroke>
          <CssParameter name="stroke">#000</CssParameter>
          <CssParameter name="stroke-opacity">0.25</CssParameter>
          <CssParameter name="stroke-width">0.5</CssParameter>
        </Stroke>
      </PolygonSymbolizer>
    </Rule>`);
    }
    const sld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>Default</Name>
    <UserStyle>
      <Name>Default</Name>
      <Title>Default</Title>
      <FeatureTypeStyle>
        ${rules.join()}
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;
    setSld(this.selectedLayer.layer, sld);
    const style = (await this.HsStylerService.parseStyle(sld)).style;
    if (style) {
      this.selectedLayer.layer.setStyle(style);
    }
  }
}
