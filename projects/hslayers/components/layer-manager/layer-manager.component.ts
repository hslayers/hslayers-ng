import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject, takeUntil} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsCoreService} from 'hslayers-ng/shared/core';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerListService} from './logical-list/layer-manager-layerlist.service';
import {HsLayerManagerRemoveAllDialogComponent} from './dialogs/remove-all-dialog.component';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
} from 'hslayers-ng/shared/layer-manager';
import {HsLayerSynchronizerService} from 'hslayers-ng/shared/save-map';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsRemoveLayerDialogService} from 'hslayers-ng/common/remove-multiple';
import {HsSidebarService} from 'hslayers-ng/shared/sidebar';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {
  getActive,
  getAttribution,
  getThumbnail,
  getTitle,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-manager',
  templateUrl: './layer-manager.component.html',
})
export class HsLayerManagerComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy {
  layerEditorRef: ElementRef;
  @ViewChild('layerEditor', {static: false, read: ElementRef}) set content(
    content: ElementRef,
  ) {
    if (content) {
      // initially setter gets called with undefined
      this.layerEditorRef = content;
      this.hsLayerManagerService.layerEditorElement = content.nativeElement;
    }
  }
  map: any;
  shiftDown = false;
  allLayersVisible = false;
  composition_id: string;
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
  name = 'layerManager';
  layerTooltipDelay = 0;

  private end = new Subject<void>();
  constructor(
    public hsCore: HsCoreService,
    public hsUtilsService: HsUtilsService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsMapService: HsMapService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayoutService: HsLayoutService,
    public hsLayerSynchronizerService: HsLayerSynchronizerService,
    public hsEventBusService: HsEventBusService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLanguageService: HsLanguageService,
    public hsConfig: HsConfig,
    public hsLayerListService: HsLayerListService,
    public hsSidebarService: HsSidebarService,
    private HsRemoveLayerDialogService: HsRemoveLayerDialogService,
    public hsLayerSelectorService: HsLayerSelectorService,
    public hsLayerManagerVisibilityService: HsLayerManagerVisibilityService,
  ) {
    super(hsLayoutService);
    this.hsEventBusService.layerRemovals
      .pipe(takeUntil(this.end))
      .subscribe((layer) => {
        if (
          this.hsLayerSelectorService?.currentLayer?.layer == layer &&
          this.hsUtilsService.runningInBrowser()
        ) {
          const layerNode = document.getElementsByClassName(
            'hs-lm-mapcontentlist',
          )[0];
          this.hsUtilsService.insertAfter(
            this.layerEditorRef.nativeElement,
            layerNode,
          );
          this.hsLayerSelectorService.currentLayer = null;
        }
      });

    this.hsEventBusService.compositionLoads
      .pipe(takeUntil(this.end))
      .subscribe((data) => {
        if (data.error == undefined) {
          if (data.data != undefined && data.data.id != undefined) {
            this.composition_id = data.data.id;
          } else if (data.id != undefined) {
            this.composition_id = data.id;
          } else {
            this.composition_id = null;
          }
        }
      });

    this.hsEventBusService.compositionDeletes
      .pipe(takeUntil(this.end))
      .subscribe((composition) => {
        if (composition.id == this.composition_id) {
          this.composition_id = null;
        }
      });

    this.hsEventBusService.mapResets.pipe(takeUntil(this.end)).subscribe(() => {
      this.composition_id = null;
    });
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.layerTooltipDelay = this.hsConfig.layerTooltipDelay;
    this.layerlistVisible = true;
    super.ngOnInit();
  }

  changeBaseLayerVisibility(e?, layer?: Layer<Source>) {
    return this.hsLayerManagerVisibilityService.changeBaseLayerVisibility(
      e,
      layer,
    );
  }

  changeTerrainLayerVisibility(e, layer: Layer<Source>) {
    return this.hsLayerManagerVisibilityService.changeTerrainLayerVisibility(
      e,
      layer,
    );
  }

  changeLayerVisibility(toWhat: boolean, layer: HsLayerDescriptor) {
    return this.hsLayerManagerVisibilityService.changeLayerVisibility(
      toWhat,
      layer,
    );
  }

  setProp(layer: Layer<Source>, property, value): void {
    layer.set(property, value);
  }

  activateTheme(e) {
    return this.hsLayerManagerVisibilityService.activateTheme(e);
  }

  baselayerFilter = (item): boolean => {
    const r = new RegExp(this.hsLayerManagerService.data.filter, 'i');
    return r.test(item.title);
  };

  filterLayerTitles(): void {
    this.hsEventBusService.layerManagerUpdates.next();
  }

  toggleVisibilityForAll(): void {
    this.allLayersVisible = !this.allLayersVisible;
    this.hsLayerManagerService.data.layers.forEach((l) => {
      this.hsLayerManagerVisibilityService.changeLayerVisibility(
        this.allLayersVisible,
        l,
      );
      this.hsLayerListService.toggleSublayersVisibility(l);
    });
  }

  /**
   * Removes layer from map object
   * @param layer - Layer to remove
   */
  removeLayer(layer: Layer<Source>): void {
    this.map.removeLayer(layer);
  }

  /**
   * Creates remove-layer dialog which allows for single/multiple layer removal
   */
  removeMultipleLayers() {
    this.HsRemoveLayerDialogService.removeMultipleLayers(
      this.hsLayerManagerService.data.layers
        .filter((layer) => layer.showInLayerManager)
        .map((l) => {
          return l.layer;
        }),
      ['map', 'mapcatalogue'],
    );
  }

  /**
   * Removes all layers which don't have 'removable' attribute
   * set to false if user confirms the removal. Might reload composition again.
   */
  removeAllLayers(): void {
    this.hsDialogContainerService.create(
      HsLayerManagerRemoveAllDialogComponent,
      {
        composition_id: this.composition_id,
      },
    );
  }
  /**
   * Determines if layer has copyright information available *
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   */
  hasCopyright(layer: HsLayerDescriptor): boolean | undefined {
    if (!this.hsLayerSelectorService.currentLayer) {
      return;
    } else {
      return getAttribution(layer.layer)?.onlineResource != undefined;
    }
  }

  /**
   * Test if box layers are loaded
   */
  hasBoxImages(): boolean {
    return this.hsLayerManagerService.data.box_layers?.some(
      (layer) => getThumbnail(layer) !== undefined,
    );
  }

  /**
   * Test if layer (WMS) resolution is within map resolution interval
   * @param layer - Selected layer
   */
  isLayerInResolutionInterval(layer: Layer<Source>): boolean {
    return this.hsLayerManagerVisibilityService.isLayerInResolutionInterval(
      layer,
    );
  }

  /**
   * Test if selected layer is loaded in map
   * @param layer - Selected layer
   */
  layerLoaded(layer: HsLayerDescriptor): boolean {
    return this.hsLayerUtilsService.layerLoaded(layer);
  }
}
