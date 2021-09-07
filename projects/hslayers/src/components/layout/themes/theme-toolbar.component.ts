import {Component} from '@angular/core';
import {HsLayoutService} from '../public-api';
import {HsThemeService} from './theme.service';
import {HsToolbarPanelBaseComponent} from '../../toolbar/toolbar-panel-base.component';

@Component({
  selector: 'hs-theme-toolbar',
  templateUrl: './theme-toolbar.html',
})
export class HsThemeToolbarComponent extends HsToolbarPanelBaseComponent {
  constructor(
    public HsLayoutService: HsLayoutService,
    public HsThemeService: HsThemeService
  ) {
    super(HsLayoutService);
  }
  name = 'themeToggle';

  toggleTheme(): void {
    if (this.HsThemeService.isDarkTheme()) {
      this.HsThemeService.setLightTheme();
    } else {
      this.HsThemeService.setDarkTheme();
    }
  }
}
