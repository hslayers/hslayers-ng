import {Component, Input, OnInit} from '@angular/core';
import {Feature} from 'ol';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Geometry} from 'ol/geom';
import {Observable, map, startWith, tap} from 'rxjs';
import {Vector as VectorSource} from 'ol/source';

import {AsyncPipe, NgForOf} from '@angular/common';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsStylerPartBaseComponent} from '../style-part-base.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  standalone: true,
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule,
    TranslateCustomPipe,
    AsyncPipe,
  ],
  selector: 'hs-comparison-filter',
  templateUrl: './comparison-filter.component.html',
})
export class HsComparisonFilterComponent
  extends HsStylerPartBaseComponent
  implements OnInit {
  @Input() filter;
  @Input() parent;

  private readonly OPERATORS = {
    default: ['==', '*=', '!='],
    numeric: ['<', '<=', '>', '>='],
  };

  private features: Feature<Geometry>[] = [];

  attributeControl: FormControl;
  attributes: string[];
  operators: Observable<string[]>;

  constructor(
    private hsLayerSelectorService: HsLayerSelectorService,
    private hsLayerUtilsService: HsLayerUtilsService,
  ) {
    super();

    const layer = this.hsLayerSelectorService.currentLayer.layer;
    const src = layer.getSource();
    this.features = (src as VectorSource).getFeatures();
    this.attributes = this.hsLayerUtilsService.listAttributes(this.features);
  }

  ngOnInit(): void {
    this.attributeControl = new FormControl(this.filter[1] ?? null);
    this.operators = this.attributeControl.valueChanges.pipe(
      tap((attr) => {
        // Update the filter when attribute changes
        this.filter[1] = attr;
        this.emitChange();
      }),
      map((attr: string) => {
        if (!isNaN(Number(this.features[0].get(attr)))) {
          return [...this.OPERATORS.default, ...this.OPERATORS.numeric];
        }
        return this.OPERATORS.default;
      }),
      startWith([...this.OPERATORS.default, ...this.OPERATORS.numeric]),
    );
  }

  remove(): void {
    if (this.parent) {
      this.parent.splice(this.parent.indexOf(this.filter), 1);
    } else {
      this.deleteRuleFilter();
    }
    this.emitChange();
  }
}
