import {Component, OnInit} from '@angular/core';

import {HsDatasourcesService} from '../datasource-selector.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsMickaFilterService} from './micka-filters.service';

@Component({
  selector: 'hs-micka-filters',
  template: require('./micka-filters.html'),
})
export class HsMickaFilterComponent {
  query;
  mickaDatasetConfig;
  queryCatalogs;
  modalVisible;
  keywordsDropdownVisible = false;

  constructor(
    public hsDatasourcesService: HsDatasourcesService,
    public hsLayoutService: HsLayoutService,
    public hsLogService: HsLogService,
    public hsMickaFilterService: HsMickaFilterService // used in template
  ) {
    this.query = hsDatasourcesService.data.query;
    //FIXME: this.mickaDatasetConfig = scope.$eval(attrs['mickaDatasetConfig']);
    this.queryCatalogs = () => hsDatasourcesService.queryCatalogs();
  }

  /**
   * @function openMickaAdvancedSearch
   * @param {object} mickaDatasetConfig Micka datasource config
   * @description Opens Micka Advanced Search dialog, might pass current search string.
   */
  openMickaAdvancedSearch(mickaDatasetConfig): void {
    if (
      this.hsLayoutService.contentWrapper.querySelector(
        '.hs-ds-advanced-micka'
      ) === null
    ) {
      this.hsLogService.warn('Not implemented');
      /*const el = angular.element('<div hs-advanced-micka-dialog></div>');
      el[0].setAttribute(
        'micka-dataset-config',
        JSON.stringify(mickaDatasetConfig)
      );
      //FIXME: $compile
      this.$compile(el)(this);
      this.hsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(el[0]);*/
    } else {
      this.modalVisible = true;
    }
    if (this.hsDatasourcesService.data.query.title) {
      this.hsDatasourcesService.data.query.textFilter = this.hsDatasourcesService.data.query.title;
    }
  }

  /**
   * @function setOtnKeyword
   * @param {string} theme Selected Otn theme keyword
   * @description Select Otn Keyword as query subject (used with dropdown list in Gui)
   */
  setOtnKeyword(theme: string): void {
    if (theme == '-') {
      theme = '';
    }
    this.hsDatasourcesService.data.query.Subject = theme;
    this.hsDatasourcesService.queryCatalogs();
  }
}
