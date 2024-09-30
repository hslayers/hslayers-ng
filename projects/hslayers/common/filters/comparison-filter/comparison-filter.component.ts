import {AsyncPipe, NgClass, NgStyle} from '@angular/common';
import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChange,
  WritableSignal,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {Feature} from 'ol';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Geometry} from 'ol/geom';
import {
  Observable,
  catchError,
  concat,
  filter,
  map,
  of,
  share,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {Vector as VectorSource} from 'ol/source';
import {WfsFeatureAttribute} from 'hslayers-ng/types';

import {Filter} from '../filter.type';
import {FilterRangeInputComponent} from '../filter-range-input/filter-range-input.component';
import {HsFiltersService} from '../filters.service';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';

interface Operator {
  value: string;
  alias: string;
}

@Component({
  standalone: true,
  imports: [
    NgClass,
    NgStyle,
    ReactiveFormsModule,
    FormsModule,
    TranslateCustomPipe,
    AsyncPipe,
    FilterRangeInputComponent,
  ],
  selector: 'hs-comparison-filter',
  templateUrl: './comparison-filter.component.html',
  styleUrls: ['./comparison-filter.component.scss'],
})
export class HsComparisonFilterComponent
  extends HsStylerPartBaseComponent
  implements OnInit, OnChanges
{
  @Input() filter: Filter;
  @Input() parent: Filter;

  filterRangeInput = viewChild<FilterRangeInputComponent>(
    FilterRangeInputComponent,
  );
  expanded = computed(() => this.filterRangeInput()?.expanded() ?? false);

  private readonly OPERATORS = {
    default: [
      {value: '==', alias: '='},
      {value: '!=', alias: '≠'},
    ],
    stringBased: [{value: '*=', alias: '≈'}],
    numeric: [
      {value: '<', alias: '<'},
      {value: '<=', alias: '≤'},
      {value: '>', alias: '>'},
      {value: '>=', alias: '≥'},
    ],
  };

  features: Feature<Geometry>[] = [];

  attributeControl: FormControl;
  attributes: string[];
  operators: Observable<Operator[]>;
  currentAttribute: WritableSignal<WfsFeatureAttribute> = signal(null);

  hsFiltersService = inject(HsFiltersService);
  hsLayerUtilsService = inject(HsLayerUtilsService);
  hsLayoutService = inject(HsLayoutService);
  destroyRef = inject(DestroyRef);

  loading: WritableSignal<boolean> = signal(false);

  constructor() {
    super();
    this.updateFeatures();
  }

  isWfsFilter = toSignal(
    this.hsLayoutService.mainpanel$.pipe(map((panel) => panel === 'wfsFilter')),
  );

  /**
   * In case user toggles between layer with comparison filters set up
   * component is not recreated, only its inputs are changed.
   * In that case we need to update features and reinitialize the filter.
   */
  ngOnChanges({
    filter,
    parent,
  }: {
    filter?: SimpleChange & {currentValue: any};
    parent?: SimpleChange & {currentValue: any};
  }): void {
    if (filter && filter.previousValue) {
      this.updateFeatures();
      this.initializeFilter();
    }
  }

  ngOnInit(): void {
    this.initializeFilter();
  }

  /**
   * Set up the filter with initial values and streams
   * Is used both on init and on filter change (in case previous value is present)
   */
  private initializeFilter(): void {
    // Initialize attribute control with the current filter value or null
    this.attributeControl = new FormControl(this.filter[1] ?? null);

    /**
     * Stream to get initial attribute values.
     * Serves basically as startWith but with observable
     * NOTE: take(1) to allow switch to subsequentAttributes in concat
     */
    const initialAttribute$ = this.getAttributeWithValues(
      this.attributeControl.value,
    ).pipe(take(1));

    // Stream to handle subsequent attribute changes
    const subsequentAttributes$ = this.attributeControl.valueChanges.pipe(
      tap(() => this.loading.set(true)),
      switchMap((attrName: string) => {
        this.filter[1] = attrName;
        return this.getAttributeWithValues(attrName);
      }),
    );

    // Combine initial and subsequent attribute streams
    const currentAttribute$ = concat(
      initialAttribute$,
      subsequentAttributes$,
    ).pipe(
      tap((attr) => {
        this.currentAttribute.set(attr);
        this.loading.set(false);
      }),
    );

    // Update the operators stream
    this.operators = currentAttribute$.pipe(
      filter((attr) => attr !== null),
      tap((attr) => {
        this.currentAttribute.set(attr);
        this.loading.set(false);
      }),
      map((attr) => {
        if (attr?.isNumeric) {
          if (this.filter[2] === '<value>') {
            this.filter[2] = attr.range?.min || 0;
          }
          return [...this.OPERATORS.default, ...this.OPERATORS.numeric];
        }
        return [...this.OPERATORS.default, ...this.OPERATORS.stringBased];
      }),
      startWith(this.OPERATORS.default),
      share(),
      catchError((error) => {
        console.error('Error fetching attribute values:', error);
        this.loading.set(false);
        return of(this.OPERATORS.default);
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  /**
   * Retrieves attribute with values based on the current filter type (WFS or local)
   * @param attrName The name of the attribute to retrieve
   * @returns An Observable of WfsFeatureAttribute
   */
  private getAttributeWithValues(
    attrName: string,
  ): Observable<WfsFeatureAttribute> {
    return this.isWfsFilter()
      ? this.hsFiltersService.getAttributeWithValues(attrName)
      : this.getLocalAttributesWithValues(attrName);
  }

  /**
   * Returns an array of values for the given attribute from the existing features.
   * @param attrName The name of the attribute to retrieve values from.
   * @returns An array of values for the given attribute.
   */
  private getValuesFromExistingFeatures(attrName: string): any[] {
    return this.hsFiltersService.getSortedUniqueValues(
      this.features.map((feature) => feature.get(attrName)),
    );
  }

  /**
   * Creates WFSFeatureAttribute object from the existing feature values
   * @param attrName The name of the attribute to retrieve.
   * @returns An observable of WfsFeatureAttribute.
   */
  getLocalAttributesWithValues(
    attrName: string,
  ): Observable<WfsFeatureAttribute> {
    const values = this.getValuesFromExistingFeatures(attrName);
    const isNumeric = !isNaN(Number(values[0]));

    return of({
      name: attrName,
      type: 'unknown',
      isNumeric,
      range: isNumeric
        ? {
            min: Math.min(...values),
            max: Math.max(...values),
          }
        : undefined,
      values,
    });
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
      this.hsFiltersService.removeFilter(this.parent, this.filter);
    } else {
      this.deleteRuleFilter();
    }
    this.emitChange();
  }
}
