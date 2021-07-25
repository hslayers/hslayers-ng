import {Component, OnInit} from '@angular/core';
import {HsGeolocationService} from './geolocation.service';
import {HsLayoutService} from '../layout/layout.service';
@Component({
  selector: 'hs-geolocation',
  templateUrl: './partials/geolocation.html',
})
export class HsGeolocationComponent implements OnInit {
  collapsed: boolean;
  constructor(
    public HsGeolocationService: HsGeolocationService,
    public HsLayoutService: HsLayoutService
  ) {}
  ngOnInit(): void {
    this.collapsed = true;
  }
  geolocationVisible(): boolean {
    return (
      this.HsLayoutService.componentEnabled('geolocationButton') &&
      this.HsLayoutService.componentEnabled('guiOverlay')
    );
  }
}
