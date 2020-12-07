import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {HsDatasourcesService} from '../datasource-selector.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMickaFilterService} from './micka-filters.service';
import {HsUtilsService} from '../../utils/utils.service';

@Component({
  selector: 'hs-micka-suggestions-dialog',
  templateUrl: './micka-suggestions-dialog.html',
})
export class HsMickaSuggestionsDialogComponent
  implements HsDialogComponent, OnInit {
  @Input() data;
  loaderImage;

  viewRef: ViewRef;

  constructor(
    public hsDatasourcesService: HsDatasourcesService,
    public hsLayoutService: HsLayoutService,
    public hsMickaFilterService: HsMickaFilterService,
    public HsUtilsService: HsUtilsService
  ) {
    this.hsMickaFilterService.suggestionsModalVisible = true;
    this.loaderImage = this.HsUtilsService.resolveEsModule(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../../../img/ajax-loader.gif')
    );
    this.hsMickaFilterService.suggestionFilter = this.hsDatasourcesService.data.query[
      this.hsMickaFilterService.suggestionConfig.input
    ];
  }

  ngOnInit(): void {
    this.hsLayoutService.layoutElement
      .querySelector('.hs-ds-sug-filter')
      .focus();
  }

   /**
   * @function addSuggestion
   * @param {string} text Selected property value from suggestions
   * @description Save suggestion into Query object
   */
  addSuggestion(text: string): void {
    this.hsDatasourcesService.data.query[
      this.hsMickaFilterService.suggestionConfig.input
    ] = text;
    this.hsMickaFilterService.suggestionsModalVisible = false;
  }
}
