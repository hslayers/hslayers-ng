import {HsLayoutService} from '../layout.service';
import {Injectable} from '@angular/core';
import {Theme, dark, light} from './theme';

@Injectable({
  providedIn: 'root',
})
export class HsThemeService {
  active: Theme = light;
  availableThemes: Theme[] = [light, dark];
  constructor(public HsLayoutService: HsLayoutService) {}

  getAvailableThemes(): Theme[] {
    return this.availableThemes;
  }

  getActiveTheme(): Theme {
    return this.active;
  }

  isDarkTheme(): boolean {
    return this.active.name === dark.name;
  }

  setDarkTheme(): void {
    this.setActiveTheme(dark);
  }

  setLightTheme(): void {
    this.setActiveTheme(light);
  }

  setActiveTheme(theme: Theme): void {
    this.active = theme;

    Object.keys(this.active.properties).forEach((property) => {
      document.documentElement.style.setProperty(
        property,
        this.active.properties[property]
      );
    });
  }
}
