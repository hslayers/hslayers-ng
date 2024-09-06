import {AsyncPipe, NgForOf} from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import {Feature} from 'ol';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Geometry} from 'ol/geom';
import {
  Observable,
  catchError,
  filter,
  map,
  of,
  share,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {Vector as VectorSource} from 'ol/source';
import {WfsFeatureAttribute} from 'hslayers-ng/types';

import {HsFiltersService} from './filters.service';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {toSignal} from '@angular/core/rxjs-interop';

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
  styles: `
    .comparison-filter-container {
      position: relative;
      min-height: 50px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(248, 248, 248, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  `,
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
  currentAttribute: WritableSignal<WfsFeatureAttribute> = signal(null);

  hsFiltersService = inject(HsFiltersService);
  hsLayerUtilsService = inject(HsLayerUtilsService);
  hsLayoutService = inject(HsLayoutService);

  loading: WritableSignal<boolean> = signal(false);

  constructor() {
    super();
    this.updateFeatures();
  }

  isWfsFilter = toSignal(
    this.hsLayoutService.mainpanel$.pipe(map((panel) => panel === 'wfsFilter')),
  );

  ngOnInit(): void {
    this.attributeControl = new FormControl(this.filter[1] ?? null);
    const currentAttribute$ = this.attributeControl.valueChanges.pipe(
      tap(() => {
        this.loading.set(true);
      }),
      switchMap((attrName: string) => {
        this.filter[1] = attrName;
        return this.isWfsFilter()
          ? this.hsFiltersService.getAttributeWithValues(attrName)
          : /**
             * If used in styler, we have no values so we create WFSFeatureAttribute
             * with name, type and isNumeric flag
             * TODO: possibly get values from features
             */
            of({
              name: attrName,
              type: 'unknown',
              isNumeric: !isNaN(Number(this.features[0]?.get(attrName))),
            });
      }),
      startWith({
        name: this.attributeControl.value,
        type: 'unknown',
        isNumeric: !isNaN(
          Number(this.features[0]?.get(this.attributeControl.value)),
        ),
      }),
    );

    this.operators = currentAttribute$.pipe(
      filter((attr) => attr !== null),
      tap((attr) => {
        this.currentAttribute.set(attr);
        this.loading.set(false);
      }),
      map((attr) => {
        if (attr?.isNumeric) {
          return [...this.OPERATORS.default, ...this.OPERATORS.numeric];
        }
        return this.OPERATORS.default;
      }),
      startWith(this.OPERATORS.default),
      share(),
      catchError((error) => {
        console.error('Error fetching attribute values:', error);
        this.loading.set(false);
        return of(this.OPERATORS.default);
      }),
    );
  }

  /**
   * Updates the features and attributes based on the selected layer
   */
  updateFeatures(): void {
    const layer = this.hsFiltersService.selectedLayer?.layer;
    if (layer) {
      const src = layer.getSource();
      this.features = (src as VectorSource).getFeatures();
      /**
       * If WFS layer is used, use the attributes from the layer descriptor,
       * otherwise (in styler) use the attributes from the features.
       */
      this.attributes = this.isWfsFilter()
        ? this.hsFiltersService.layerAttributes.map((a) => a.name)
        : this.hsLayerUtilsService.listAttributes(
            this.features,
            false,
            this.hsFiltersService.attributesExcludedFromList,
          );
    }
  }

  /**
   * Removes the current filter from its parent or deletes the rule filter
   */
  remove(): void {
    if (this.parent) {
      this.parent.splice(this.parent.indexOf(this.filter), 1);
    } else {
      this.deleteRuleFilter();
    }
    this.emitChange();
  }
}
