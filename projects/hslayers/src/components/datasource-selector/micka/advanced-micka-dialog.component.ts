import {Component, Input, OnInit} from '@angular/core';

import {HsConfig} from '../../../config.service';
import {HsDatasourcesService} from '../datasource-selector.service';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMickaFilterService} from './micka-filters.service';
import {HsMickaSuggestionsDialogComponent} from './micka-suggestions-dialog.component';

@Component({
  selector: 'hs-advanced-micka-dialog',
  templateUrl: './advanced-micka-dialog.html',
})
export class HsAdvancedMickaDialogComponent {
  query;
  modalVisible = true;
  suggestionsModalVisible;
  @Input('endpoint') mickaDatasetConfig;

  constructor(
    public hsConfig: HsConfig,
    public hsMickaFilterService: HsMickaFilterService,
    public hsDatasourcesService: HsDatasourcesService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLayoutService: HsLayoutService
  ) {
    this.query = hsDatasourcesService.data.query;
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
    if (this.hsConfig.design === 'md') {
      this.hsMickaFilterService.suggestionFilter = this.hsDatasourcesService.data.query[
        input
      ];
      this.hsMickaFilterService.suggestionFilterChanged(
        this.mickaDatasetConfig
      );
    } else {
      if (
        this.hsLayoutService.contentWrapper.querySelector(
          '.hs-ds-suggestions-micka'
        ) === null
      ) {
        this.hsDialogContainerService.create(
          HsMickaSuggestionsDialogComponent,
          {mickaDatasetConfig: this.mickaDatasetConfig}
        );
        //FIXME: $compile
        /*const el = angular.element('<div hs-micka-suggestions-dialog></div>');
        this.hsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)(scope);*/
      } else {
        this.suggestionsModalVisible = true;
        const filterElement = this.hsLayoutService.contentWrapper.querySelector(
          '.hs-ds-sug-filter'
        );
        this.hsMickaFilterService.suggestionFilter = this.query[input];
        filterElement.focus();
      }
      this.hsMickaFilterService.suggestionFilterChanged(
        this.mickaDatasetConfig
      );
    }
  }
}
