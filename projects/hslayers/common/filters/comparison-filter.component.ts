import {AsyncPipe, NgForOf} from '@angular/common';
import {Component, Input, OnInit, inject} from '@angular/core';
import {Feature} from 'ol';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Geometry} from 'ol/geom';
import {Observable, map, startWith, tap} from 'rxjs';
import {Vector as VectorSource} from 'ol/source';

import {HsFiltersService} from './filters.service';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
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

  features: Feature<Geometry>[] = [];

  attributeControl: FormControl;
  attributes: string[];
  operators: Observable<string[]>;

  hsFiltersService = inject(HsFiltersService);
  hsLayerUtilsService = inject(HsLayerUtilsService);

  constructor() {
    super();
    this.updateFeatures();
  }

  ngOnInit(): void {
    this.attributeControl = new FormControl(this.filter[1] ?? null);
    this.operators = this.attributeControl.valueChanges.pipe(
      tap((attr) => {
        this.filter[1] = attr;
        this.emitChange();
      }),
      map((attr: string) => {
        if (!isNaN(Number(this.features[0]?.get(attr)))) {
          return [...this.OPERATORS.default, ...this.OPERATORS.numeric];
        }
        return this.OPERATORS.default;
      }),
      startWith([...this.OPERATORS.default, ...this.OPERATORS.numeric]),
    );
  }

  updateFeatures(): void {
    const layer = this.hsFiltersService.selectedLayer?.layer;
    if (layer) {
      const src = layer.getSource();
      this.features = (src as VectorSource).getFeatures();
      this.attributes = this.hsLayerUtilsService.listAttributes(this.features);
    }
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
