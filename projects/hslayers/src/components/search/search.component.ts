import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSearchService} from './search.service';
import {HsShareUrlService} from './../permalink/share-url.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
@Component({
  selector: 'hs-search',
  templateUrl: './partials/search.html',
})
export class HsSearchComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy
{
  replace = false;
  clearVisible = false;
  searchInputVisible: boolean;
  searchResultsReceivedSubscription: Subscription;
  name = 'search';

  constructor(
    public HsSearchService: HsSearchService,
    public HsEventBusService: HsEventBusService,
    public HsShareUrlService: HsShareUrlService,
    hsLayoutService: HsLayoutService,
    hsLanguageService: HsLanguageService,
    hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'search',
      module: 'hs.search',
      order: 15,
      fits: true,
      title: () => hsLanguageService.getTranslation('PANEL_HEADER.SEARCH'),
      description: () =>
        hsLanguageService.getTranslation('SIDEBAR.descriptions.SEARCH'),
      icon: 'icon-search',
    });
    this.searchResultsReceivedSubscription =
      this.HsEventBusService.searchResultsReceived.subscribe(() => {
        this.clearVisible = true;
      });
  }
  ngOnDestroy(): void {
    this.searchResultsReceivedSubscription.unsubscribe();
  }

  ngOnInit(): void {
    window.innerWidth < 767
      ? (this.searchInputVisible = false)
      : (this.searchInputVisible = true);
  }
}
