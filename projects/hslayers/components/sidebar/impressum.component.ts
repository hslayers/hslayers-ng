import {Component, computed, signal} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-impressum',
  templateUrl: './impressum.component.html',
  imports: [TranslateCustomPipe],
  standalone: true,
})
export class HsImpressumComponent {
  version = signal('16.0.0-next.0');
  logoError = signal(false);

  logoPath = computed(
    () => this.hsConfig.assetsPath + 'img/hslayers-ng-logo.png',
  );

  githubReleaseUrl = computed(
    () =>
      `https://github.com/hslayers/hslayers-ng/releases/tag/${this.version()}`,
  );

  constructor(public hsConfig: HsConfig) {}

  onLogoError(): void {
    this.logoError.set(true);
  }
}
