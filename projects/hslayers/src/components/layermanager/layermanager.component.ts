import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Layer} from 'ol/layer';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerManagerRemoveAllDialogComponent} from './remove-all-dialog.component';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerSynchronizerService} from '../save-map/layer-synchronizer.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';

import {
  getActive,
  getAttribution,
  getThumbnail,
  getTitle,
} from '../../common/layer-extensions';

@Component({
  selector: 'hs-layer-manager',
  templateUrl: './partials/layermanager.html',
})
export class HsLayerManagerComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('layerEditor', {static: false, read: ElementRef})
  layerEditorRef: ElementRef;
  map: any;
  shiftDown = false;
  data: any;
  layerlistVisible: boolean;
  hovering: boolean;
  physicalLayerListEnabled = false;
  icons = [
    'bag1.svg',
    'banking4.svg',
    'bar.svg',
    'beach17.svg',
    'bicycles.svg',
    'building103.svg',
    'bus4.svg',
    'cabinet9.svg',
    'camping13.svg',
    'caravan.svg',
    'church15.svg',
    'church1.svg',
    'coffee-shop1.svg',
    'disabled.svg',
    'favourite28.svg',
    'football1.svg',
    'footprint.svg',
    'gift-shop.svg',
    'gps40.svg',
    'gps41.svg',
    'gps42.svg',
    'gps43.svg',
    'gps5.svg',
    'hospital.svg',
    'hot-air-balloon2.svg',
    'information78.svg',
    'library21.svg',
    'location6.svg',
    'luggage13.svg',
    'monument1.svg',
    'mountain42.svg',
    'museum35.svg',
    'park11.svg',
    'parking28.svg',
    'pharmacy17.svg',
    'port2.svg',
    'restaurant52.svg',
    'road-sign1.svg',
    'sailing-boat2.svg',
    'ski1.svg',
    'swimming26.svg',
    'telephone119.svg',
    'toilets2.svg',
    'train-station.svg',
    'university2.svg',
    'warning.svg',
    'wifi8.svg',
  ];
  getActive = getActive;
  getTitle = getTitle;
  getThumbnail = getThumbnail;
  private ngUnsubscribe = new Subject();
  constructor(
    public HsCore: HsCoreService,
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsMapService: HsMapService,
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayermanagerWmstService: HsLayerManagerWmstService,
    public HsLayoutService: HsLayoutService,
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public HsLayerSynchronizerService: HsLayerSynchronizerService,
    public HsEventBusService: HsEventBusService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLanguageService: HsLanguageService,
    public HsConfig: HsConfig
  ) {
    this.data = this.HsLayerManagerService.data;
    this.HsMapService.loaded().then((map) => this.init(map));

    this.HsEventBusService.layerRemovals
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((layer: HsLayerDescriptor) => {
        if (
          this.HsLayerManagerService?.currentLayer?.layer == layer &&
          this.HsUtilsService.runningInBrowser()
        ) {
          const layerNode = document.getElementsByClassName(
            'hs-lm-mapcontentlist'
          )[0];
          this.HsUtilsService.insertAfter(
            this.layerEditorRef.nativeElement,
            layerNode
          );
          this.HsLayerManagerService.currentLayer = null;
        }
      });

    this.HsEventBusService.compositionLoads
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        if (data.error == undefined) {
          if (data.data != undefined && data.data.id != undefined) {
            this.HsLayerManagerService.composition_id = data.data.id;
          } else if (data.id != undefined) {
            this.HsLayerManagerService.composition_id = data.id;
          } else {
            this.HsLayerManagerService.composition_id = null;
          }
        }
      });

    this.HsEventBusService.compositionDeletes
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((composition) => {
        if (composition.id == this.HsLayerManagerService.composition_id) {
          this.HsLayerManagerService.composition_id = null;
        }
      });
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
    this.layerlistVisible = true;
  }

  ngAfterViewInit(): void {
    this.HsLayerManagerService.layerEditorElement =
      this.layerEditorRef.nativeElement;
  }
  changeBaseLayerVisibility(e?, layer?: Layer) {
    return this.HsLayerManagerService.changeBaseLayerVisibility(e, layer);
  }

  changeTerrainLayerVisibility(e, layer: Layer) {
    return this.HsLayerManagerService.changeTerrainLayerVisibility(e, layer);
  }

  changeLayerVisibility(toWhat: boolean, layer: Layer) {
    return this.HsLayerManagerService.changeLayerVisibility(toWhat, layer);
  }

  isLayerType(layer: Layer, type: string): boolean {
    switch (type) {
      case 'wms':
        return this.HsLayerManagerService.isWms(layer);
      case 'point':
        return layer.getSource().hasPoint;
      case 'line':
        return layer.getSource().hasLine;
      case 'polygon':
        return layer.getSource().hasPoly;
      default:
        return false;
    }
  }

  setProp(layer: Layer, property, value): void {
    layer.set(property, value);
  }

  activateTheme(e) {
    return this.HsLayerManagerService.activateTheme(e);
  }

  baselayerFilter = (item): boolean => {
    const r = new RegExp(this.HsLayerManagerService.data.filter, 'i');
    return r.test(item.title);
  };

  filterLayerTitles(): void {
    this.HsEventBusService.layerManagerUpdates.next();
  }

  /**
   * Removes layer from map object
   * @param layer - Layer to remove
   */
  removeLayer(layer: Layer): void {
    this.map.removeLayer(layer);
  }

  /**
   * Removes all layers which don't have 'removable' attribute
   * set to false if user confirms the removal. Might reload composition again.
   */
  removeAllLayers(): void {
    this.HsDialogContainerService.create(
      HsLayerManagerRemoveAllDialogComponent,
      {}
    );
  }

  /**
   * Determines if layer has copyright information avaliable *
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   */
  hasCopyright(layer: HsLayerDescriptor): boolean | undefined {
    if (!this.HsLayerManagerService.currentLayer) {
      return;
    } else {
      return getAttribution(layer.layer)?.onlineResource != undefined;
    }
  }

  /**
   * Test if box layers are loaded
   */
  hasBoxImages(): boolean {
    return this.data.box_layers?.some(
      (layer) => getThumbnail(layer) !== undefined
    );
  }

  /**
   * Test if layer (WMS) resolution is within map resolution interval
   * @param layer - Selected layer
   */
  isLayerInResolutionInterval(layer: Layer): boolean {
    return this.HsLayerManagerService.isLayerInResolutionInterval(layer);
  }

  /**
   * Test if selected layer is loaded in map
   * @param layer - Selected layer
   */
  layerLoaded(layer: HsLayerDescriptor): boolean {
    return this.HsLayerUtilsService.layerLoaded(layer);
  }

  /**
   * @param m
   */
  init(m): void {
    this.map = this.HsMapService.map;
    this.HsLayerSynchronizerService.init(this.map);
    this.HsEventBusService.mapResets
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.HsLayerManagerService.composition_id = null;
      });
  }
}
