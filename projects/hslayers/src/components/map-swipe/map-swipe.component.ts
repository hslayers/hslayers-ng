import {Component, OnDestroy} from '@angular/core';

import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {Subscription} from 'rxjs/internal/Subscription';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapSwipeService} from './map-swipe.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-map-swipe',
  templateUrl: './map-swipe.component.html',
  styleUrls: ['./map-swipe.component.scss'],
})
export class HsMapSwipeComponent
  extends HsPanelBaseComponent
  implements OnDestroy
{
  layerManagerUpdatesSubscription: Subscription;
  orientation = 'vertical';
  constructor(
    public hsLayoutService: HsLayoutService,
    public hsSidebarService: HsSidebarService,
    public hsLanguageService: HsLanguageService,
    public hsEventBusService: HsEventBusService,
    public hsMapSwipeService: HsMapSwipeService,
    public hsLayerUtilsService: HsLayerUtilsService, //In template
    public hsLayerShiftingService: HsLayerShiftingService
  ) {
    super(hsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'mapSwipe',
      module: 'hs.mapSwipe',
      order: 18,
      fits: true,
      title: () =>
        this.hsLanguageService.getTranslation('PANEL_HEADER.MAP_SWIPE'),
      description: () =>
        this.hsLanguageService.getTranslation('SIDEBAR.descriptions.MAP_SWIPE'),
      icon: 'icon-layers',
    });
    this.hsMapSwipeService.init();
    this.layerManagerUpdatesSubscription =
      this.hsEventBusService.layerManagerUpdates.subscribe((layer: any) => {
        this.hsMapSwipeService.fillSwipeLayers(layer);
      });
  }
  name = 'mapSwipe';

  setOrientation(event: any): void {
    this.orientation = event.target.checked ? 'horizontal' : 'vertical';
    this.hsMapSwipeService.swipeCtrl.set('orientation', this.orientation);
  }

  resetSwipePos(): void {
    this.hsMapSwipeService.swipeCtrl.set('position', 0.5);
  }

  ngOnDestroy(): void {
    this.layerManagerUpdatesSubscription.unsubscribe();
  }

  drop(event: CdkDragDrop<string[]>, right?: boolean): void {
    let draggedLayer;
    let replacedLayer;
    this.hsMapSwipeService.movingRight = right;
    if (event.previousContainer === event.container) {
      draggedLayer = event.container.data[event.previousIndex];
      replacedLayer = event.container.data[event.currentIndex];
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      draggedLayer = event.previousContainer.data[event.previousIndex];
      replacedLayer = event.container.data[event.currentIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    if (draggedLayer && replacedLayer?.layer) {
      this.hsLayerShiftingService.moveTo(draggedLayer, replacedLayer.layer);
    } else {
      this.hsMapSwipeService.fillSwipeLayers(draggedLayer);
    }
  }
}
