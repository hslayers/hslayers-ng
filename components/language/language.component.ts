import {Component, OnInit} from '@angular/core';
import {HsLanguageService} from './language.service';
@Component({
  selector: 'hs-language',
  template: require('./partials/language.html'),
})
export class HsLanguageComponent implements OnInit {
  available_languages: any;

  constructor(public HsLanguageService: HsLanguageService) {}

  ngOnInit(): void {
    this.available_languages = this.HsLanguageService.listAvailableLanguages();
  }
  //$scope.$emit('scope_loaded', 'Language');
}
