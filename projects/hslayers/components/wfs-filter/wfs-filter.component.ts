import * as olFormatFilter from 'ol/format/filter';
import {Component, Input, OnDestroy, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HsFiltersComponent, HsFiltersService} from 'hslayers-ng/common/filters';
import {HsLayerDescriptor, WfsFeatureAttribute} from 'hslayers-ng/types';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HttpClient} from '@angular/common/http';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {catchError, lastValueFrom, of} from 'rxjs';
import {
  getWfsAttributes,
  getWfsUrl,
  setWfsAttributes,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-wfs-filter',
  templateUrl: './wfs-filter.component.html',
  styles: ``,
  standalone: true,
  imports: [HsFiltersComponent, FormsModule],
})
export class HsWfsFilterComponent implements OnInit, OnDestroy {
  @Input() rule: any = {};
  @Input() preselectedLayer: HsLayerDescriptor;

  hsFiltersService = inject(HsFiltersService);
  hsLayerManagerService = inject(HsLayerManagerService);
  hsUtilsService = inject(HsUtilsService);
  hsLayoutService = inject(HsLayoutService);
  httpClient = inject(HttpClient);

  availableLayers: HsLayerDescriptor[] = [];
  selectedLayer: HsLayerDescriptor | null = null;

  ngOnInit() {
    this.updateAvailableLayers();
    if (this.preselectedLayer) {
      this.selectLayer(this.preselectedLayer);
    }

    this.hsFiltersService.attributesExcludedFromList = [
      'hs_normalized_IDW_value',
      'boundedBy',
    ];
  }

  ngOnDestroy() {
    this.hsFiltersService.attributesExcludedFromList = undefined;
  }

  /**
   * Updates the list of available WFS layers
   */
  updateAvailableLayers() {
    this.availableLayers = this.hsLayerManagerService.data.layers.filter(
      (l: HsLayerDescriptor) =>
        this.hsUtilsService.instOf(l.layer, VectorLayer) &&
        this.hsUtilsService.instOf(l.layer.getSource(), VectorSource) &&
        getWfsUrl(l.layer),
    );
  }

  /**
   * Selects a layer and updates the filter service
   * @param layer The layer to select
   */
  async selectLayer(layer: HsLayerDescriptor | null) {
    this.selectedLayer = layer;

    // Reset the rule when changing layers
    this.rule = {};

    const wfsUrl = getWfsUrl(layer.layer);
    const url = this.hsUtilsService.proxify(
      `${wfsUrl}?service=WFS&request=DescribeFeatureType&version=2.0.0&typeName=${layer.layer.get('layerName')}`,
    );
    const wfsAttributes = getWfsAttributes(layer.layer);
    if (wfsAttributes) {
      this.hsFiltersService.setLayerAttributes(wfsAttributes);
      return;
    }

    const response = await lastValueFrom(
      this.httpClient.get(url, {responseType: 'text'}).pipe(
        catchError(async (e) => {
          console.error(e);
          return '';
        }),
      ),
    );

    if (response) {
      const attributes = this.parseWfsDescribeFeatureType(response);
      console.log('Parsed attributes:', attributes);
      this.hsFiltersService.setLayerAttributes(attributes);
      setWfsAttributes(layer.layer, attributes);
    }

    this.hsFiltersService.setSelectedLayer(layer);
  }

  /**
   * Parses the WFS DescribeFeatureType response XML into an array of feature attributes.
   * @param xmlString The XML string response from the WFS DescribeFeatureType request.
   * @returns An array of FeatureAttribute objects, each containing the name, type, and isNumeric flag of an attribute.
   * If no feature type is found in the XML, returns an empty array.
   */
  private parseWfsDescribeFeatureType(
    xmlString: string,
  ): WfsFeatureAttribute[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const featureTypeElement = xmlDoc.querySelector(
      'xsd\\:complexType, complexType',
    );

    if (featureTypeElement) {
      return Array.from(
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
    } else {
      console.warn('No feature type found in the XML response');
      return [];
    }
  }

  /**
   * Determines if a given type is numeric.
   * @param type The type string to check.
   * @returns True if the type is numeric, false otherwise.
   */
  private isNumericType(type: string): boolean {
    const numericTypes = ['decimal', 'double', 'float', 'int'];
    return numericTypes.some((numericType) => type.includes(numericType));
  }

  /**
   * Handles changes in the filter
   */
  onChange() {
    if (this.rule.filter) {
      const parsedFilter = this.parseFilter(this.rule.filter);
      console.log('Parsed OpenLayers filter for WFS:', parsedFilter);
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
        return olFormatFilter.like(operands[0], operands[1]);
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
