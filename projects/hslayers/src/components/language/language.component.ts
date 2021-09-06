import {Component, OnInit} from '@angular/core';

import {HsLanguageService} from './language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
@Component({
  selector: 'hs-language',
  templateUrl: './partials/language.html',
})
export class HsLanguageComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  available_languages: any;
  name = 'language';
  constructor(
    public HsLanguageService: HsLanguageService,
    HsLayoutService: HsLayoutService
  ) {
    super(HsLayoutService);
  }

  ngOnInit(): void {
    this.available_languages = this.HsLanguageService.listAvailableLanguages();
  }
  //$scope.$emit('scope_loaded', 'Language');
}
