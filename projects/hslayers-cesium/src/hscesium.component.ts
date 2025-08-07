import {AfterViewInit, Component, DestroyRef, inject} from '@angular/core';
import {filter} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HS_PRMS, HsShareUrlService} from 'hslayers-ng/services/share';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';
import {HsToolbarPanelContainerService} from 'hslayers-ng/services/panels';

import {HsCesiumService} from './hscesium.service';
import {HsToggleViewComponent} from './toggle-view/toggle-view.component';

@Component({
  selector: 'hs-cesium',
  templateUrl: './hscesium.component.html',
  styleUrl: './hscesium.component.scss',
  standalone: false,
})
export class HslayersCesiumComponent implements AfterViewInit {
  hsCesiumService = inject(HsCesiumService);
  hsShareUrlService = inject(HsShareUrlService);
  hsMapService = inject(HsMapService);
  hsSidebarService = inject(HsSidebarService);
  private hsToolbarPanelContainerService = inject(
    HsToolbarPanelContainerService,
  );
  hsEventBusService = inject(HsEventBusService);
  hsLayoutService = inject(HsLayoutService);
  private destroyRef = inject(DestroyRef);

  app = 'default';

  ngAfterViewInit(): void {
    //Timeout needed because view container might not
    //be resized yet and globe will be zoomed out in that case
    setTimeout(() => {
      this.hsCesiumService.init();
    }, 100);

    const view = this.hsShareUrlService.getParamValue(HS_PRMS.view);
    if (view != '2d') {
      this.hsShareUrlService.updateCustomParams({view: '3d'});
      this.hsMapService.visible = false;
    } else {
      this.hsShareUrlService.updateCustomParams({view: '2d'});
    }

    this.hsToolbarPanelContainerService.create(HsToggleViewComponent, {});

    this.hsEventBusService.layermanagerDimensionChanges.subscribe((data) =>
      this.hsCesiumService.dimensionChanged(data.layer, data.dimension),
    );

    this.hsEventBusService.sizeChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        /**
         * Resize immidiatelly only in case cesium is visible
         */
        filter((size) => this.hsCesiumService.visible),
      )
      .subscribe((size) => this.hsCesiumService.resize(size));
  }
}
