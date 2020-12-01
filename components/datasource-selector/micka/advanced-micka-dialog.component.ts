import {Component, Input, ViewRef} from '@angular/core';

import {HsConfig} from '../../../config.service';
import {HsDatasourcesService} from '../datasource-selector.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMickaFilterService} from './micka-filters.service';
import {HsMickaSuggestionsDialogComponent} from './micka-suggestions-dialog.component';

@Component({
  selector: 'hs-advanced-micka-dialog',
  template: require('./advanced-micka-dialog.html'),
})
export class HsAdvancedMickaDialogComponent implements HsDialogComponent {
  query;
  @Input() data; //HsEndpoint
  mickaDatasetConfig: any;

  constructor(
    public hsConfig: HsConfig,
    public hsMickaFilterService: HsMickaFilterService,
    public hsDatasourcesService: HsDatasourcesService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLayoutService: HsLayoutService
  ) {
    this.query = hsDatasourcesService.data.query;
    this.hsMickaFilterService.advancedModalVisible = true;
  }
  viewRef: ViewRef;
  ngOnInit(): void {
    this.mickaDatasetConfig = this.data;
  }
  /**
   * @function showSuggestions
   * @param {string} input Suggestion class type name (e.g. "Organisation Name")
   * @param {string} param Suggestion paramater of Micka service (e.g. "org")
   * @param {string} field Expected property name in response object (e.g. "value")
   * @description Shows suggestions dialog and edits suggestion config.
   */
  showSuggestions(input: string, param: string, field: string): void {
    this.hsMickaFilterService.changeSuggestionConfig(input, param, field);
    if (
      this.hsLayoutService.layoutElement.querySelector(
        '.hs-ds-suggestions-micka'
      ) === null
    ) {
      this.hsDialogContainerService.create(HsMickaSuggestionsDialogComponent, {
        mickaDatasetConfig: this.mickaDatasetConfig,
      });
    } else {
      this.hsMickaFilterService.suggestionsModalVisible = true;
      const filterElement = this.hsLayoutService.layoutElement.querySelector(
        '.hs-ds-sug-filter'
      );
      this.hsMickaFilterService.suggestionFilter = this.query[input];
      filterElement.focus();
    }
    this.hsMickaFilterService.suggestionFilterChanged(this.mickaDatasetConfig);
  }
}
