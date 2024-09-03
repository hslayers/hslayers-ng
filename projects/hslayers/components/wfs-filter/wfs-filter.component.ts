import * as olFormatFilter from 'ol/format/filter';
import {Component, Input, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HsFiltersComponent, HsFiltersService} from 'hslayers-ng/common/filters';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {getWfsUrl} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-wfs-filter',
  templateUrl: './wfs-filter.component.html',
  styles: ``,
  standalone: true,
  imports: [HsFiltersComponent, FormsModule],
})
export class HsWfsFilterComponent implements OnInit {
  @Input() rule: any = {};
  @Input() preselectedLayer: HsLayerDescriptor;

  hsFiltersService = inject(HsFiltersService);
  hsLayerManagerService = inject(HsLayerManagerService);
  hsUtilsService = inject(HsUtilsService);
  hsLayoutService = inject(HsLayoutService);

  availableLayers: HsLayerDescriptor[] = [];
  selectedLayer: HsLayerDescriptor | null = null;

  ngOnInit() {
    this.updateAvailableLayers();
    if (this.preselectedLayer) {
      this.selectLayer(this.preselectedLayer);
    }
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
  selectLayer(layer: HsLayerDescriptor | null) {
    this.selectedLayer = layer;
    this.hsFiltersService.setSelectedLayer(layer);
    // Reset the rule when changing layers
    this.rule = {};
  }

  /**
   * Handles changes in the filter
   */
  onChange() {
    if (this.rule.filter) {
      const parsedFilter = this.parseFilter(this.rule.filter);
      console.log('Parsed OpenLayers filter for WFS:', parsedFilter);
      // You can now use this parsedFilter with OpenLayers for WFS requests
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
