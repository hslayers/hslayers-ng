import {AfterViewInit, Component, DestroyRef} from '@angular/core';

import {HS_PRMS, HsShareUrlService} from 'hslayers-ng/components/share';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';
import {HsToolbarPanelContainerService} from 'hslayers-ng/services/panels';

import {HsCesiumService} from './hscesium.service';
import {HsToggleViewComponent} from './toggle-view/toggle-view.component';
import {filter} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'hs-cesium',
  templateUrl: './hscesium.component.html',
  styles: `
    .hs-cesium-container {
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      margin-right: 0;
    }
  `,
})
export class HslayersCesiumComponent implements AfterViewInit {
  app = 'default';
  constructor(
    public HsCesiumService: HsCesiumService,
    public HsShareUrlService: HsShareUrlService,
    public HsMapService: HsMapService,
    public HsSidebarService: HsSidebarService,
    private hsToolbarPanelContainerService: HsToolbarPanelContainerService,
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    private DestroyRef: DestroyRef,
  ) {}

  ngAfterViewInit(): void {
    //Timeout needed because view container might not
    //be resized yet and globe will be zoomed out in that case
    setTimeout(() => {
      this.HsCesiumService.init();
    }, 100);

    const view = this.HsShareUrlService.getParamValue(HS_PRMS.view);
    if (view != '2d') {
      this.HsShareUrlService.updateCustomParams({view: '3d'});
      this.HsMapService.visible = false;
    } else {
      this.HsShareUrlService.updateCustomParams({view: '2d'});
    }

    this.hsToolbarPanelContainerService.create(HsToggleViewComponent, {});

    this.HsEventBusService.layermanagerDimensionChanges.subscribe((data) =>
      this.HsCesiumService.dimensionChanged(data.layer, data.dimension),
    );

    this.HsEventBusService.sizeChanges
      .pipe(
        takeUntilDestroyed(this.DestroyRef),
        /**
         * Resize immidiatelly only in case cesium is visible
         */
        filter((size) => this.HsCesiumService.visible),
      )
      .subscribe((size) => this.HsCesiumService.resize(size));
  }
}
