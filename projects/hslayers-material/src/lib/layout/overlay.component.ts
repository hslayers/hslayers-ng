import * as olExtent from 'ol/extent';
import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {HsAttributionDialogComponent} from './attribution-dialog.component';
import {
  HsConfig,
  HsEventBusService,
  HsLayerManagerService,
  HsMapService,
} from 'hslayers-ng';
import {MatDialog} from '@angular/material/dialog';
import {MouseWheelZoom} from 'ol/interaction';
import {Vector as VectorLayer} from 'ol/layer';
import {platformModifierKeyOnly as platformModifierKeyOnlyCondition} from 'ol/events/condition';

@Component({
  selector: 'hs-mat-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
})
export class HsMatOverlayComponent implements OnInit {
  
  constructor(
    public HsConfig: HsConfig,
    private HsEventBusService: HsEventBusService,
    private HsMapService: HsMapService,
    private HsLayerManagerService: HsLayerManagerService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const mapControls = this.HsConfig.componentsEnabled.mapControls;
    this.HsEventBusService.olMapLoads.subscribe((map) => {
      map.addInteraction(
        new MouseWheelZoom({
          condition: (browserEvent): boolean => {
            if (mapControls == false) {
              return false;
            }
            return this.HsConfig.zoomWithModifierKeyOnly
              ? platformModifierKeyOnlyCondition(browserEvent)
              : true;
          },
        })
      );
    });

    this.HsConfig.componentsEnabled.mapControls = false;
    this.HsConfig.componentsEnabled.defaultViewButton = false;
  }

  openAttributionDialog(event): void {
    this.dialog.open(HsAttributionDialogComponent, {
      data: this.HsMapService.getLayersArray()
        .filter((layer) => layer.getVisible())
        .map((layer) => layer.getSource().getAttributions())
        .filter((f) => f)
        .map((getAttributions) => getAttributions(undefined))
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
    const mapView = this.HsMapService.getMap()?.getView();
    return mapView?.getZoom() > mapView?.getMinZoom();
  }

  canZoomIn(): boolean {
    const mapView = this.HsMapService.getMap()?.getView();
    return mapView?.getZoom() < mapView?.getMaxZoom();
  }

  adjustZoom(delta: number): void {
    const mapView = this.HsMapService.getMap()?.getView();
    mapView.animate({zoom: mapView.getZoom() + delta, duration: 300});
  }

  defaultView(): void {
    this.HsMapService.getMap()?.getView().animate({
      center: this.HsConfig.default_view.getCenter(),
      zoom: this.HsConfig.default_view.getZoom(),
      duration: 300,
    });
  }

  maxView(): void {
    const extent = olExtent.createEmpty();

    if (this.HsLayerManagerService.get().data.layers.length == 0) {
      return;
    }

    this.HsLayerManagerService.get().data.layers.forEach((layer) => {
      if (layer.visible && layer.layer instanceof VectorLayer) {
        olExtent.extend(extent, layer.layer.getSource().getExtent());
      }
    });

    this.HsMapService.getMap()
      ?.getView()
      .fit(extent, {
        size: this.HsMapService.getMap().getSize(),
        padding: [50, 50, 50, 50],
        duration: 300,
      });
  }
}
