import {AsyncPipe} from '@angular/common';
import {Component, Input, inject} from '@angular/core';
import {Observable, map} from 'rxjs';
import {combineLatestWith, filter, startWith} from 'rxjs/operators';
import {toObservable} from '@angular/core/rxjs-interop';

import {HsConfig} from 'hslayers-ng/config';
import {HsLayerDescriptor, HsLayermanagerFolder} from 'hslayers-ng/types';
import {HsLayerListItemComponent} from './layer-list-item/layer-list-item.component';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';

@Component({
  selector: 'hs-layer-manager-layer-list',
  templateUrl: './layer-manager-layerlist.component.html',
  imports: [HsLayerListItemComponent, AsyncPipe],
})
export class HsLayerListComponent {
  hsConfig = inject(HsConfig);
  hsLayerManagerService = inject(HsLayerManagerService);

  @Input({required: true}) folder: string;

  filteredLayers: Observable<HsLayerDescriptor[]>;

  constructor() {
    this.filteredLayers = this.hsLayerManagerService.data.filter.pipe(
      startWith(''),
      combineLatestWith(
        toObservable(this.hsLayerManagerService.data.folders).pipe(
          map((folders) => {
            return folders.get(this.folder);
          }),
          startWith({layers: [], zIndex: 0}),
        ),
      ),
      filter(([_, folder]) => !!folder),
      map(([filter, folder]) => this.filterLayers(folder, filter)),
    );
  }

  filterLayers(
    folder: HsLayermanagerFolder,
    filter: string,
  ): HsLayerDescriptor[] {
    const regex = new RegExp(filter, 'i');
    return folder.layers.filter(
      (layer) => regex.test(layer.title) && layer.showInLayerManager,
    );
  }
}
