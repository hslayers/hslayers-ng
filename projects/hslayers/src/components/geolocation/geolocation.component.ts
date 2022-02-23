import {Component, OnInit} from '@angular/core';
import {HsGeolocationService} from './geolocation.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
@Component({
  selector: 'hs-geolocation',
  templateUrl: './partials/geolocation.html',
})
export class HsGeolocationComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  collapsed: boolean;
  constructor(
    public HsGeolocationService: HsGeolocationService,
    public HsLayoutService: HsLayoutService
  ) {
    super(HsLayoutService);
  }
  ngOnInit(): void {
    this.collapsed = true;
  }
  isVisible(): boolean {
    return (
      this.HsLayoutService.componentEnabled(
        'geolocationButton',
        this.data.app
      ) && this.HsLayoutService.componentEnabled('guiOverlay', this.data.app)
    );
  }
}
