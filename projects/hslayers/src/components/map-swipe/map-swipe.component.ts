import {Component, OnDestroy, OnInit} from '@angular/core';

import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {Subject} from 'rxjs';

import {HsLanguageService} from '../language/language.service';
import {
  HsLayerShiftingService,
  LayerListItem,
} from '../../common/layer-shifting/layer-shifting.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapSwipeService, SwipeSide} from './map-swipe.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-map-swipe',
  templateUrl: './map-swipe.component.html',
  styleUrls: ['./map-swipe.component.scss'],
})
export class HsMapSwipeComponent
  extends HsPanelBaseComponent
  implements OnDestroy, OnInit {
  private end = new Subject<void>();
  swipeSide = SwipeSide;
  placeholders = {
    entire: true,
    left: true,
    right: true,
  };
  constructor(
    public hsLayoutService: HsLayoutService,
    private hsSidebarService: HsSidebarService,
    private hsLanguageService: HsLanguageService,
    public hsMapSwipeService: HsMapSwipeService,
    private hsLayerUtilsService: HsLayerUtilsService, //In template
    private hsLayerShiftingService: HsLayerShiftingService,
  ) {
    super(hsLayoutService);
  }

  name = 'mapSwipe';

  ngOnInit() {
    this.hsSidebarService.addButton({
      panel: 'mapSwipe',
      module: 'hs.mapSwipe',
      order: 18,
      fits: true,
      title: 'PANEL_HEADER.MAP_SWIPE',
      description: 'SIDEBAR.descriptions.MAP_SWIPE',
      icon: 'view_column_2',
    });
  }

  /**
   * Return label for button changing map swipe state from enabled to disabled
   */
  getEnabledButtonString(): string {
    if (this.hsMapSwipeService.swipeControlActive) {
      return 'MAP_SWIPE.disableSwipe';
    } else {
      return 'MAP_SWIPE.enableSwipe';
    }
  }

  /**
   * Return label for button changing swipe orientation from horizontal swipe to vertical swipe
   */
  getOrientationButtonString(): string {
    if (this.hsMapSwipeService.orientationVertical) {
      return 'MAP_SWIPE.horizontalSwipe';
    } else {
      return 'MAP_SWIPE.verticalSwipe';
    }
  }

  /**
   * Reset swipe slider position to default
   */
  resetSwipePos(): void {
    this.hsMapSwipeService.swipeCtrl.set('position', 0.5);
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }
  /**
   * Modify arrays after drag and drop
   * @param event - CdkDragDrop drop event
   * @param right - (Optional) Item dragged to right
   */
  drop(event: CdkDragDrop<string[]>, side?: SwipeSide): void {
    let draggedLayer;
    let replacedLayer;
    this.hsMapSwipeService.movingSide = side;
    this.hsMapSwipeService.wasMoved = true;
    if (event.previousContainer === event.container) {
      draggedLayer = event.container.data[event.previousIndex];
      replacedLayer = event.container.data[event.currentIndex];
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      draggedLayer = event.previousContainer.data[event.previousIndex];
      replacedLayer = event.container.data[event.currentIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    if (draggedLayer && replacedLayer?.layer) {
      this.hsLayerShiftingService.moveTo(draggedLayer, replacedLayer.layer);
    } else {
      this.hsMapSwipeService.fillSwipeLayers(draggedLayer.layer);
    }
  }

  /**
   * Change selected layer visibility
   * @param layer - Selected layer from the list
   */
  changeLayerVisibility(layer: LayerListItem): void {
    this.hsMapSwipeService.changeLayerVisibility(layer);
  }

  /**
   * Set map-swipe swipe element orientation
   */
  setOrientation(): void {
    this.hsMapSwipeService.setOrientation();
  }

  /**
   * Check if layers for map-swipe component are available
   */
  layersAvailable(): boolean {
    return this.hsMapSwipeService.layersAvailable();
  }

  /**
   * Set control for map-swipe component
   */
  setControl(): void {
    this.hsMapSwipeService.setControl();
  }

  /**
   * Get rightLayers for map-swipe component
   */
  getRightLayers(): LayerListItem[] {
    return this.hsMapSwipeService.rightLayers;
  }
}
