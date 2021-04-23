import { Component, OnInit, Inject } from '@angular/core';
import * as olExtent from 'ol/extent';
import { Vector as VectorLayer } from 'ol/layer';
import Attribution from 'ol/control/Attribution';
import {
  HsConfig,
  HsMapService,
  HsLayerManagerService
} from 'hslayers-ng';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'hs-mat-overlay',
  templateUrl: './overlay.component.html',
})
export class HsMatOverlayComponent implements OnInit {

  constructor(
    public HsConfig: HsConfig,
    private HsMapService: HsMapService,
    private HsLayerManagerService: HsLayerManagerService,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.HsConfig.componentsEnabled.mapControls = false;
    this.HsConfig.componentsEnabled.defaultViewButton = false;
  }

  openAttributionDialog(event): void {
    const dialogRef = this.dialog.open(AttributionDialog, {
      data: this.HsMapService.map?.getLayers().getArray()
        .filter(layer => layer.getVisible())
        .map(layer => layer.getSource().getAttributions())
        .filter(f => f)
        .map(getAttributions => getAttributions())
        .reduce((acc, item) => {
          // if (Array.isArray(item)) return acc.push(...item);
          // return acc.push(item);
          if (Array.isArray(item)) return [...acc, ...item];
          return [...acc, item];
        }, []),
    });
  }

  canZoomOut(): boolean {
    const mapView = this.HsMapService.map?.getView();
    return mapView?.getZoom() > mapView?.getMinZoom();
  }

  canZoomIn(): boolean {
    const mapView = this.HsMapService.map?.getView();
    return mapView?.getZoom() < mapView?.getMaxZoom();
  }

  adjustZoom(delta: number): void {
    const mapView = this.HsMapService.map?.getView();
    mapView.animate({zoom: mapView.getZoom() + delta, duration: 300});
  }

  defaultView(): void {
    this.HsMapService.map?.getView().animate({
      center: this.HsConfig.default_view.getCenter(),
      zoom: this.HsConfig.default_view.getZoom(),
      duration: 300
    });
  }

  maxView(): void {
    const extent = olExtent.createEmpty();

    if (this.HsLayerManagerService.data.layers.length == 0) return;

    this.HsLayerManagerService.data.layers.forEach(layer => {
      if (layer.visible && layer.layer instanceof VectorLayer) {
        olExtent.extend(extent, layer.layer.getSource().getExtent());
      }
    });

    this.HsMapService.map?.getView().fit(extent, {
      size: this.HsMapService.map.getSize(),
      padding: [50, 50, 50, 50],
      constrainResolution: true,
      duration: 300
    });
  }
}

@Component({
  selector: 'hs-mat-attributions',
  template: `
    <h1 mat-dialog-title>Attributions</h1>
    <div mat-dialog-content class="mat-typography">
      <ul>
        <li *ngFor="let item of data" [innerHTML]="item"></li>
      </ul>
    </div>
  `,
  styleUrls: ['attribution-dialog.scss'],
})
export class AttributionDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: string[]) {}
}
