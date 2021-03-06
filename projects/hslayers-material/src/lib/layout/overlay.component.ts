import * as olExtent from 'ol/extent';
import {Component, OnInit} from '@angular/core';
import {HsAttributionDialogComponent} from './attribution-dialog.component';
import {HsConfig, HsLayerManagerService, HsMapService} from 'hslayers-ng';
import {MatDialog} from '@angular/material/dialog';
import {Vector as VectorLayer} from 'ol/layer';

@Component({
  selector: 'hs-mat-overlay',
  templateUrl: './overlay.component.html',
})
export class HsMatOverlayComponent implements OnInit {
  constructor(
    public HsConfig: HsConfig,
    private HsMapService: HsMapService,
    private HsLayerManagerService: HsLayerManagerService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.HsConfig.componentsEnabled.mapControls = false;
    this.HsConfig.componentsEnabled.defaultViewButton = false;
  }

  openAttributionDialog(event): void {
    this.dialog.open(HsAttributionDialogComponent, {
      data: this.HsMapService.map
        ?.getLayers()
        .getArray()
        .filter((layer) => layer.getVisible())
        .map((layer) => layer.getSource().getAttributions())
        .filter((f) => f)
        .map((getAttributions) => getAttributions())
        .reduce((acc, item) => {
          // if (Array.isArray(item)) return acc.push(...item);
          // return acc.push(item);
          if (Array.isArray(item)) {
            return [...acc, ...item];
          }
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
      duration: 300,
    });
  }

  maxView(): void {
    const extent = olExtent.createEmpty();

    if (this.HsLayerManagerService.data.layers.length == 0) {
      return;
    }

    this.HsLayerManagerService.data.layers.forEach((layer) => {
      if (layer.visible && layer.layer instanceof VectorLayer) {
        olExtent.extend(extent, layer.layer.getSource().getExtent());
      }
    });

    this.HsMapService.map?.getView().fit(extent, {
      size: this.HsMapService.map.getSize(),
      padding: [50, 50, 50, 50],
      constrainResolution: true,
      duration: 300,
    });
  }
}
