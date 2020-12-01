import {Component, OnInit} from '@angular/core';

import {HsAdvancedMickaDialogComponent} from './advanced-micka-dialog.component';
import {HsDatasourcesService} from '../datasource-selector.service';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
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
  queryCatalog;
  modalVisible;
  keywordsDropdownVisible = false;

  constructor(
    public hsDatasourcesService: HsDatasourcesService,
    public hsLayoutService: HsLayoutService,
    public hsLogService: HsLogService,
    public hsMickaFilterService: HsMickaFilterService, // used in template
    public HsDialogContainerService: HsDialogContainerService
  ) {
    this.query = hsDatasourcesService.data.query;
    //FIXME: this.mickaDatasetConfig = scope.$eval(attrs['mickaDatasetConfig']);
    this.queryCatalogs = () => hsDatasourcesService.queryCatalogs();
    this.queryCatalog = (endpoint) =>
      hsDatasourcesService.queryCatalog(endpoint);
  }

  /**
   * @function openMickaAdvancedSearch
   * @param {object} mickaDatasetConfig Micka datasource config
   * @description Opens Micka Advanced Search dialog, might pass current search string.
   */
  openMickaAdvancedSearch(): void {
    const previousDialog = this.hsLayoutService.layoutElement.querySelector(
      '.hs-ds-advanced-micka'
    );
    if (previousDialog) {
      previousDialog.parentNode.removeChild(previousDialog);
    }
    this.HsDialogContainerService.create(
      HsAdvancedMickaDialogComponent,
      this.hsDatasourcesService.selectedEndpoint
    );
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
