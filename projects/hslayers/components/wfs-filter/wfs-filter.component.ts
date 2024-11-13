import {AsyncPipe, NgClass} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  inject,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {computed, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';

import * as olFormatFilter from 'ol/format/filter';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {catchError, filter, lastValueFrom, map, switchMap, tap} from 'rxjs';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsFiltersComponent, HsFiltersService} from 'hslayers-ng/common/filters';
import {HsLayerDescriptor, WfsFeatureAttribute} from 'hslayers-ng/types';
import {
  HsLayerManagerService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {
  HsPanelBaseComponent,
  HsPanelHeaderComponent,
} from 'hslayers-ng/common/panels';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {
  getDefinition,
  getName,
  getWfsAttributes,
  getWfsUrl,
  getWorkspace,
  setWfsAttributes,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-wfs-filter',
  templateUrl: './wfs-filter.component.html',
  styles: `
    .hs-wfs-filter-panel > div {
      padding: 0 0.75rem;
    }
  `,
  standalone: true,
  imports: [
    NgClass,
    HsFiltersComponent,
    FormsModule,
    AsyncPipe,
    HsPanelHeaderComponent,
    TranslateCustomPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsWfsFilterComponent extends HsPanelBaseComponent {
  name = 'wfsFilter';

  selectedLayer = signal<HsLayerDescriptor | null>(null);
  rule = computed(() => this.selectedLayer()?.layer.get('wfsFilter') || {});

  hsFiltersService = inject(HsFiltersService);
  hsEventBusService = inject(HsEventBusService);
  hsLayerManagerService = inject(HsLayerManagerService);
  hsUtilsService = inject(HsUtilsService);
  hsLayoutService = inject(HsLayoutService);
  httpClient = inject(HttpClient);
  hsLayerSelectorService = inject(HsLayerSelectorService);
  hsToastService = inject(HsToastService);

  availableLayers: Signal<HsLayerDescriptor[]>;

  loadingLayerInfo = signal(false);

  constructor() {
    super();
    const mainPanelStream = this.hsEventBusService.mapEventHandlersSet.pipe(
      switchMap(() => this.hsLayoutService.mainpanel$),
      filter((which) => which === 'wfsFilter'),
      takeUntilDestroyed(),
    );

    this.availableLayers = toSignal(
      mainPanelStream.pipe(
        map(() => {
          return this.hsLayerManagerService.data.layers.filter(
            (l: HsLayerDescriptor) =>
              this.hsUtilsService.instOf(l.layer, VectorLayer) &&
              this.hsUtilsService.instOf(l.layer.getSource(), VectorSource) &&
              (getWfsUrl(l.layer) || getDefinition(l.layer)),
          );
        }),
        tap((layers) => {
          const currentLayerTitle =
            this.hsLayerSelectorService.currentLayer?.title;
          if (currentLayerTitle) {
            const layerToSelect = layers.find(
              (layer) => layer.title === currentLayerTitle,
            );
            if (layerToSelect) {
              this.selectLayer(layerToSelect);
            }
          }
        }),
      ),
    );

    // Use the same stream to update attributesExcludedFromList
    mainPanelStream.subscribe(() => {
      this.hsFiltersService.attributesExcludedFromList = [
        'hs_normalized_IDW_value',
        'boundedBy',
      ];
    });

    this.hsEventBusService.resetWfsFilter
      .pipe(
        takeUntilDestroyed(),
        filter(() => this.hsLayoutService.mainpanel === 'wfsFilter'),
      )
      .subscribe(() => {
        this.updateLayer(this.selectedLayer(), undefined, undefined);
      });
  }

  /**
   * Selects a layer and updates the filter service
   * @param layer The layer to select
   */
  async selectLayer(layer: HsLayerDescriptor | null) {
    try {
      this.selectedLayer.set(layer);

      if (!layer || this.setExistingLayerAttributes(layer)) {
        return;
      }
      this.loadingLayerInfo.set(true);
      const wfsUrl = getWfsUrl(layer.layer) || getDefinition(layer.layer).url;
      const url = new URL(wfsUrl);
      url.search = ''; // Clear existing query parameters
      url.searchParams.set('service', 'WFS');
      url.searchParams.set('request', 'DescribeFeatureType');
      url.searchParams.set('version', '2.0.0');
      url.searchParams.set('typeName', getName(layer.layer));

      const proxifiedUrl = this.hsUtilsService.proxify(url.toString());

      const response = await lastValueFrom(
        this.httpClient.get(proxifiedUrl, {responseType: 'text'}).pipe(
          catchError((error) => {
            console.error('Error fetching WFS DescribeFeatureType:', error);
            this.hsToastService.createToastPopupMessage(
              'PANEL_HEADER.WFS_FILTER',
              'WFS_FILTER.ERROR_FETCHING_LAYER_INFO',
              {
                toastStyleClasses: 'text-bg-danger',
              },
            );
            throw error; // Re-throw the error to be caught by the outer try-catch
          }),
        ),
      );

      if (response) {
        const {attributes, geometryAttribute} =
          this.parseWfsDescribeFeatureType(
            response,
            layer.layer as VectorLayer<VectorSource>,
          );
        this.hsFiltersService.setLayerAttributes(attributes);
        setWfsAttributes(layer.layer, attributes);
        /**
         * Set geometryAttribute to the layer's source so it can be easily accessed in loader function
         */
        layer.layer.getSource().set('geometryAttribute', geometryAttribute);
      }
      this.hsFiltersService.setSelectedLayer(layer);
    } catch (error) {
      console.error('Error in selectLayer:', error);
      this.hsToastService.createToastPopupMessage(
        'PANEL_HEADER.WFS_FILTER',
        'WFS_FILTER.ERROR_SELECTING_LAYER',
        {
          toastStyleClasses: 'text-bg-danger',
        },
      );
    } finally {
      this.loadingLayerInfo.set(false);
    }
  }

  /**
   * Sets the existing layer attributes and returns true if successful, false otherwise
   */
  private setExistingLayerAttributes(layer: HsLayerDescriptor): boolean {
    const layerAttributes = getWfsAttributes(layer.layer);
    if (layerAttributes) {
      this.hsFiltersService.setLayerAttributes(layerAttributes);
      return true;
    }
    return false;
  }

  /**
   * Parses the WFS DescribeFeatureType response XML into an array of feature attributes.
   * @param xmlString The XML string response from the WFS DescribeFeatureType request.
   * @param layer The layer object to determine geometry attribute from.
   * @returns An object containing the attributes and geometry attribute name.
   */
  private parseWfsDescribeFeatureType(
    xmlString: string,
    layer: VectorLayer<VectorSource>,
  ): {attributes: WfsFeatureAttribute[]; geometryAttribute: string | null} {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const featureTypeElement = xmlDoc.querySelector(
      'xsd\\:complexType, complexType',
    );

    if (featureTypeElement) {
      const allAttributes = Array.from(
        featureTypeElement.querySelectorAll('xsd\\:element, element'),
      ).map((el) => {
        const name = el.getAttribute('name');
        const type = el.getAttribute('type');
        return {
          name,
          type,
          isNumeric: this.isNumericType(type),
        };
      });

      const geometryAttribute = this.determineGeometryAttribute(
        layer,
        allAttributes,
      );

      const attributes = allAttributes.filter(
        (attr) => attr.name !== geometryAttribute,
      );

      return {attributes, geometryAttribute};
    } else {
      console.warn('No feature type found in the XML response');
      return {attributes: [], geometryAttribute: null};
    }
  }

  /**
   * Determines if a given type is numeric.
   * @param type The type string to check.
   * @returns True if the type is numeric, false otherwise.
   */
  private isNumericType(type: string): boolean {
    const numericTypes = ['decimal', 'double', 'float', 'int'];
    return numericTypes.some((numericType) =>
      type.toLowerCase().includes(numericType),
    );
  }

  /**
   * Determines the geometry attribute name based on the layer and attributes.
   * @param layer The layer object to determine geometry attribute from.
   * @param attributes The array of feature attributes.
   * @returns The geometry attribute name or null if not found.
   */
  private determineGeometryAttribute(
    layer: VectorLayer<VectorSource>,
    attributes: WfsFeatureAttribute[],
  ): string | null {
    // Try to get geometry attribute name from layers' source
    const source = layer.getSource();
    const feature = source.getFeatures()[0];
    if (feature) {
      const geometryName = feature.getGeometryName();
      if (
        geometryName &&
        attributes.some((attr) => attr.name === geometryName)
      ) {
        return geometryName;
      }
    }

    // Look for geometry attribute in WFS response
    const geometryAttr = attributes.find((attr) =>
      this.isGeometryType(attr.type),
    );
    return geometryAttr ? geometryAttr.name : null;
  }

  /**
   * Determines if a given type is a geometry type.
   * @param type The type string to check.
   * @returns True if the type is a geometry type, false otherwise.
   */
  private isGeometryType(type: string): boolean {
    const geometryKeywords = [
      'geometry',
      'point',
      'line',
      'polygon',
      'surface',
      'curve',
    ];
    return geometryKeywords.some((keyword) =>
      type.toLowerCase().includes(keyword),
    );
  }

  /**
   * Checks if a value is considered empty
   */
  private isEmptyValue(value: any): boolean {
    return (
      value === '<value>' ||
      value === null ||
      value === undefined ||
      value === ''
    );
  }

  /**
   * Recursively checks if all filter values are filled
   */
  private areAllFilterValuesFilled(filter: any[]): boolean {
    if (!Array.isArray(filter)) {
      return !this.isEmptyValue(filter);
    }

    const [operator, ...operands] = filter;

    // Check if it's a comparison operator
    if (!Array.isArray(operands[0])) {
      return !this.isEmptyValue(operands[1]);
    }

    // For logical operators, check all operands
    return operands.every((operand) => this.areAllFilterValuesFilled(operand));
  }

  /**
   * Applies the current filter to the selected layer and refreshes the source
   */
  applyFilters() {
    const selectedLayer = this.selectedLayer();
    if (selectedLayer) {
      const currentFilter = this.rule().filter;

      if (!this.areAllFilterValuesFilled(currentFilter)) {
        this.hsToastService.createToastPopupMessage(
          'PANEL_HEADER.WFS_FILTER',
          'WFS_FILTER.INCOMPLETE_FILTER',
          {
            toastStyleClasses: 'text-bg-warning',
          },
        );
        return;
      }
      const parsedFilter = this.parseFilter(currentFilter);
      this.updateLayer(selectedLayer, parsedFilter, this.rule());
    }
  }

  /**
   * Updates the layer with the parsed filter
   */
  updateLayer(
    selectedLayer: HsLayerDescriptor,
    parsedFilter: any,
    wfsFilter: any[],
  ) {
    selectedLayer.layer.set('wfsFilter', wfsFilter);
    const source = selectedLayer.layer.getSource();
    source.set('filter', parsedFilter);
    source.refresh();
    /**
     * Manually pull features from WFS if layer is from Layman
     */
    if (getWorkspace(selectedLayer.layer)) {
      this.hsEventBusService.refreshLaymanLayer.next(
        selectedLayer.layer as VectorLayer<VectorSource>,
      );
    }
  }

  /**
   * Parses the filter into OpenLayers format
   * @param filter The filter to parse
   * @returns Parsed OpenLayers filter
   */
  parseFilter(filter: any[]): any {
    if (!Array.isArray(filter)) {
      return null;
    }

    const [operator, ...operands] = filter;

    switch (operator) {
      case '||':
        return olFormatFilter.or(...operands.map((op) => this.parseFilter(op)));
      case '&&':
        return olFormatFilter.and(
          ...operands.map((op) => this.parseFilter(op)),
        );
      case '!':
        return olFormatFilter.not(this.parseFilter(operands[0]));
      case '==':
        return olFormatFilter.equalTo(operands[0], operands[1]);
      case '*=':
        return olFormatFilter.like(operands[0], `*${operands[1]}*`);
      case '!=':
        return olFormatFilter.notEqualTo(operands[0], operands[1]);
      case '<':
        return olFormatFilter.lessThan(operands[0], operands[1]);
      case '<=':
        return olFormatFilter.lessThanOrEqualTo(operands[0], operands[1]);
      case '>':
        return olFormatFilter.greaterThan(operands[0], operands[1]);
      case '>=':
        return olFormatFilter.greaterThanOrEqualTo(operands[0], operands[1]);
      default:
        console.warn(`Unsupported operator: ${operator}`);
        return null;
    }
  }

  /**
   * Opens the Add Data panel
   */
  openAddDataPanel() {
    this.hsLayoutService.setMainPanel('addData');
  }
}
