import {Component, OnInit} from '@angular/core';

import {HsDatasourcesService} from '../datasource-selector.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMickaFilterService} from './micka-filters.service';

@Component({
  selector: 'hs-micka-suggestions-dialog',
  template: require('./micka-suggestions-dialog.html'),
})
export class HsMickaSuggestionsDialogComponent implements OnInit {
  suggestionsModalVisible;
  loaderImage;

  constructor(
    private hsDatasourcesService: HsDatasourcesService,
    private hsLayoutService: HsLayoutService,
    private hsMickaFilterService: HsMickaFilterService
  ) {
    this.suggestionsModalVisible = true;
    this.loaderImage = require('../../../img/ajax-loader.gif');
    this.hsMickaFilterService.suggestionFilter = this.hsDatasourcesService.data.query[
      this.hsMickaFilterService.suggestionConfig.input
    ];
  }

  ngOnInit(): void {
    this.hsLayoutService.contentWrapper
      .querySelector('.hs-ds-sug-filter')
      .focus();
  }
}
