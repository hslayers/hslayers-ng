import {Component, computed, signal, inject} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsConfig} from 'hslayers-ng/config';

@Component({
  selector: 'hs-impressum',
  templateUrl: './impressum.component.html',
  imports: [TranslatePipe],
  standalone: true,
})
export class HsImpressumComponent {
  hsConfig = inject(HsConfig);

  version = signal('16.0.0-next.3');
  logoError = signal(false);

  logoPath = computed(
    () => this.hsConfig.assetsPath + 'img/hslayers-ng-logo.png',
  );

  githubReleaseUrl = computed(
    () =>
      `https://github.com/hslayers/hslayers-ng/releases/tag/${this.version()}`,
  );

  onLogoError(): void {
    this.logoError.set(true);
  }
}
