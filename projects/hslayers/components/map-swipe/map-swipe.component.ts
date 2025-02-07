import {Component} from '@angular/core';

import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import {
  HsLayerShiftingService,
  LayerListItem,
} from 'hslayers-ng/services/layer-shifting';
import {HsMapSwipeService, SwipeSide} from './map-swipe.service';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';

@Component({
  selector: 'hs-map-swipe',
  templateUrl: './map-swipe.component.html',
  styleUrls: ['./map-swipe.component.scss'],
  standalone: false,
})
export class HsMapSwipeComponent extends HsPanelBaseComponent {
  swipeSide = SwipeSide;
  placeholders = {
    entire: true,
    left: true,
    right: true,
  };
  constructor(
    public hsMapSwipeService: HsMapSwipeService,
    private hsLayerShiftingService: HsLayerShiftingService,
  ) {
    super();
  }

  name = 'mapSwipe';
  swipeOptions = ['vertical', 'horizontal'];

  /**
   * Return label for button changing map swipe state from enabled to disabled
   */
  getEnabledButtonString(): string {
    if (this.hsMapSwipeService.swipeControlActive) {
      return 'MAP_SWIPE.disableSwipe';
    }
    return 'MAP_SWIPE.enableSwipe';
  }

  /**
   * Return label for button changing swipe orientation from horizontal swipe to vertical swipe
   */
  getOrientationButtonString(): string {
    if (this.hsMapSwipeService.orientationVertical) {
      return 'MAP_SWIPE.horizontalSwipe';
    }
    return 'MAP_SWIPE.verticalSwipe';
  }

  /**
   * Reset swipe slider position to default
   */
  resetSwipePos(): void {
    this.hsMapSwipeService.swipeCtrl.set('position', 0.5);
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
