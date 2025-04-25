import {Component, computed, input, ViewRef} from '@angular/core';

import {
  HsAddDataCatalogueMapService,
  HsAddDataCatalogueService,
} from 'hslayers-ng/services/add-data';
import {
  HsAddDataLayerDescriptor,
  WhatToAddDescriptor,
  HsEndpoint,
  HsAddDataHsLaymanLayerDescriptor,
  HsAddDataMickaLayerDescriptor,
} from 'hslayers-ng/types';
import {HsConfig} from 'hslayers-ng/config';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {HsUiExtensionsRecursiveDdComponent} from 'hslayers-ng/common/widgets';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {transform} from 'ol/proj';
import {HsMapService} from 'hslayers-ng/services/map';

@Component({
  selector: 'hs-catalogue-metadata',
  templateUrl: './catalogue-metadata.component.html',
  imports: [HsUiExtensionsRecursiveDdComponent, TranslateCustomPipe],
})
export class HsCatalogueMetadataComponent implements HsDialogComponent {
  data = input<{
    selectedLayer: HsAddDataLayerDescriptor;
    selectedDS: HsEndpoint;
  }>();

  selectedLayer = computed(() => this.data().selectedLayer);
  selectedDS = computed(() => this.data().selectedDS);

  endpointType = computed(() => this.selectedDS().type);

  addAvailable = computed(() => {
    const layer = this.selectedLayer();
    const endpointType = this.endpointType();
    return endpointType === 'micka' || layer.wfsWmsStatus === 'AVAILABLE';
  });

  availableTypes = computed(() => {
    let types = [];
    const layer = this.selectedLayer();
    if (this.isMickaLayer(layer)) {
      types = layer.links
        .map((l) => {
          return ['WMS', 'WFS'].some((t) => l.protocol.includes(t))
            ? l.protocol.includes('WMS')
              ? 'WMS'
              : 'WFS'
            : null;
        })
        .filter((type) => !!type);
    } else {
      types = layer.type;
    }
    return types.includes('WMS') ? [...types, 'WMTS'] : types;
  });

  metadataUrl = computed(() => {
    const layer = this.selectedLayer();
    if (this.isMickaLayer(layer)) {
      return `${this.selectedDS().url.replace('csw', 'record/basic')}/${layer.id}`;
    }
    return layer.metadata.record_url;
  });

  bbox = computed(() => {
    const layer = this.selectedLayer();
    if (this.isLaymanLayer(layer)) {
      return layer.bounding_box;
    }
    return layer.bbox;
  });

  viewRef: ViewRef;
  excludedKeys: string[] = ['feature', 'thumbnail', 'endpoint'];

  constructor(
    public hsConfig: HsConfig,
    public hsAddDataCatalogueService: HsAddDataCatalogueService,
    public hsAddDataCatalogueMapService: HsAddDataCatalogueMapService,
    public hsDialogContainerService: HsDialogContainerService,
    private hsMapService: HsMapService,
  ) {}

  /**
   * @param type - Type in which the layer shall be added (WMS, WFS, etc.)
   */
  async addLayerToMap(type: string): Promise<void> {
    const ds = this.selectedDS();
    const layer = this.selectedLayer();

    const whatToAdd =
      await this.hsAddDataCatalogueService.describeCatalogueLayer(ds, layer);
    whatToAdd.type = type === 'WMS' || type === 'WMTS' ? 'WMS' : type;
    this.hsAddDataCatalogueService.addLayerToMap(
      ds,
      whatToAdd as WhatToAddDescriptor<string>,
      {
        useTiles: type === 'WMTS',
      },
    );
    this.close();
  }

  private isMickaLayer(
    layer: HsAddDataLayerDescriptor,
  ): layer is HsAddDataMickaLayerDescriptor {
    return 'links' in layer && Array.isArray(layer.links);
  }

  private isLaymanLayer(
    layer: HsAddDataLayerDescriptor,
  ): layer is HsAddDataHsLaymanLayerDescriptor {
    return 'native_bounding_box' in layer;
  }

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }

  /**
   * ZoomTo to selected layer overview
   * Micka layers bbox is defined in EPSG:4326
   * Layman layers bbox is defined in EPSG:3857 (using bounding_box property)
   */
  zoomTo(): void {
    const b = this.bbox();
    if (!b) {
      return;
    }
    let first_pair = [b[0], b[1]];
    let second_pair = [b[2], b[3]];

    const currentProjection = this.hsMapService
      .getMap()
      .getView()
      .getProjection();
    const sourceProjection = this.isLaymanLayer(this.selectedLayer())
      ? 'EPSG:3857'
      : 'EPSG:4326';
    first_pair = transform(first_pair, sourceProjection, currentProjection);
    second_pair = transform(second_pair, sourceProjection, currentProjection);

    if (first_pair.some(isNaN) || second_pair.some(isNaN)) {
      return;
    }
    const extent = [
      first_pair[0],
      first_pair[1],
      second_pair[0],
      second_pair[1],
    ];
    this.hsMapService.fitExtent(extent);
  }
}
