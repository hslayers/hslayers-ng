import {Component, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {filter} from 'rxjs';

@Component({
  selector: 'hs-save-map',
  templateUrl: './save-map.component.html',
  styles: `
    .divider {
      width: 80%;
      height: 1px;
      background-color: var(--bs-gray);
      margin: 1.5rem 0;
      align-self: center;
    }
  `,
  standalone: false,
})
export class HsSaveMapComponent extends HsPanelBaseComponent implements OnInit {
  name = 'saveMap';

  isAuthenticated = this.hsCommonLaymanService.isAuthenticated;
  localDownload = false;

  constructor(
    private hsConfig: HsConfig,
    private hsSaveMapManagerService: HsSaveMapManagerService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsSaveMapService: HsSaveMapService,
  ) {
    super();
  }
  ngOnInit() {
    super.ngOnInit();

    this.hsLayoutService.mainpanel$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((panel) => panel !== 'saveMap'),
      )
      .subscribe((panel) => {
        this.localDownload = false;
      });

    window.addEventListener('beforeunload', () => {
      if (this.hsConfig.saveMapStateOnReload) {
        this.hsSaveMapService.save2storage();
      }
    });
  }

  /**
   * Save map composition as json file
   */
  saveCompoJson(): void {
    const compositionJSON =
      this.hsSaveMapManagerService.generateCompositionJson();
    const file = new Blob([JSON.stringify(compositionJSON)], {
      type: 'application/json',
    });

    // Create a temporary anchor element
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download =
      this.hsSaveMapManagerService.compoData.controls.name.value ||
      'composition'; // Use form name or default
    document.body.appendChild(a); // Append to body
    a.click(); // Programmatically click the anchor

    // Clean up: remove the anchor and revoke the URL
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}
