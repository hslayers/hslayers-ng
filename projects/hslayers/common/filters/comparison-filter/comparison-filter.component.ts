import {AsyncPipe, NgClass, NgStyle} from '@angular/common';
import {
  Component,
  DestroyRef,
  Injector,
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

import {CombinationOperator, ComparisonOperator} from 'geostyler-style';
import {Filter} from 'hslayers-ng/types';
import {FilterRangeInputComponent} from '../filter-range-input/filter-range-input.component';
import {HsAttributeSelectorComponent} from './attribute-selector/attribute-selector.component';
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

interface FilterWithArgs {
  name: 'property';
  args: [string];
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
    HsAttributeSelectorComponent,
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

  _filter: Filter;

  injector = inject(Injector);

  filterRangeInput = viewChild<FilterRangeInputComponent>(
    FilterRangeInputComponent,
  );
  expanded = computed(() => this.filterRangeInput()?.expanded() ?? false);

  private readonly _defaultOperators = [
    {value: '==', alias: '='},
    {value: '!=', alias: '≠'},
  ] as const;
  private readonly _customOperators = [
    {value: '==', alias: '= ∅'},
    {value: '!=', alias: '≠ ∅'},
  ] as const;

  private readonly OPERATORS = {
    default: [...this._defaultOperators, ...this._customOperators],
    stringBased: [{value: '*=', alias: '≈'}],
    numeric: [
      {value: '<', alias: '<'},
      {value: '<=', alias: '≤'},
      {value: '>', alias: '>'},
      {value: '>=', alias: '≥'},
    ],
  };
  customOperatorSelected = signal(false);

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

  selectedOperator = signal<string>(null);
  valueSource = signal<'value' | 'property'>('value');

  constructor() {
    super();
    this.updateFeatures();
  }

  isWfsFilter = toSignal(
    this.hsLayoutService.mainpanel$.pipe(map((panel) => panel === 'wfsFilter')),
  );

  override emitChange(): void {
    /**
     * Sync local and remote filter values
     */
    if (this.valueSource() === 'property') {
      /**
       * Form necessary for geostlyer parser to properly encode fitler into SLD
       */
      this.filter[2] = {
        name: 'property',
        args: [this.extractValue(this._filter[2] as any)],
      };
      this.filter[1] = {
        name: 'property',
        args: [this.extractValue(this._filter[1] as any)],
      };
    } else {
      this.filter[1] = this._filter[1];
      this.filter[2] = this._filter[2];
    }
    this.changes.emit();
  }

  /**
   * Extracts the value from the FilterWithArgs object
   * @param value The value to extract
   * @returns The extracted value
   */
  extractValue(value: string | FilterWithArgs): string {
    if (value && typeof value === 'object' && 'args' in value) {
      this.valueSource.set('property');
      return value.args[0];
    }
    return value as string;
  }

  /**
   * Parses filter values to extract the attribute name from the FilterWithArgs object
   * in order to keep local state simple: string based
   */
  parseFilterValues(filter: Filter): Filter {
    const localFilter = [
      filter[0],
      this.extractValue(filter[1] as FilterWithArgs),
      this.extractValue(filter[2] as FilterWithArgs),
    ] as Filter;
    return localFilter;
  }

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

  /**
   * Handles operator selection changes
   */
  onOperatorChange(e: Event): void {
    const operatorAlias = (e.target as HTMLSelectElement).value;
    const isCustom = (
      this._customOperators.map((op) => op.alias) as string[]
    ).includes(operatorAlias);
    this.customOperatorSelected.set(isCustom);
    const operators = Object.values(this.OPERATORS).flat();
    const foundOperator = operators.find(
      (op) =>
        op.alias === operatorAlias &&
        (isCustom ? op.alias.includes('∅') : !op.alias.includes('∅')),
    );
    if (foundOperator) {
      this.filter[0] = foundOperator.value as
        | ComparisonOperator
        | '!'
        | CombinationOperator;
    }
    if (isCustom) {
      this.filter[2] = undefined;
    }
    this.emitChange();
  }

  ngOnInit(): void {
    /**
     * Populate local state with copy of filter values
     */
    const f = JSON.parse(JSON.stringify(this.filter));
    this._filter = this.parseFilterValues(f);

    this.initializeFilter();
  }

  /**
   * Set up the filter with initial values and streams
   * Is used both on init and on filter change (in case previous value is present)
   */
  private initializeFilter(): void {
    this.initOperator();
    // Initialize attribute control with the current filter value or null
    this.attributeControl = new FormControl(this._filter[1] ?? null);

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
        this._filter[1] = attrName;
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

    this.operators = currentAttribute$.pipe(
      filter((attr) => attr !== null),
      tap((attr) => {
        this.currentAttribute.set(attr);
        this.loading.set(false);
      }),
      map((attr) => {
        if (attr?.isNumeric) {
          if (this._filter[2] === '<value>') {
            this._filter[2] = attr.range?.min || 0;
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
   * Init operator value and adjusts it if necessary to match the custom operator mappings
   * geostyler parses '= ∅' as '==', so in case value is undefined we need to adjust the operator
   */
  private initOperator(): void {
    const operatorValue = this._filter[0];
    const isCustom =
      ['==', '!='].includes(operatorValue) && this._filter[2] === undefined;
    this.customOperatorSelected.set(isCustom);

    const operators = Object.values(this.OPERATORS).flat();
    const operatorAlias = operators.find(
      (op) =>
        op.value === operatorValue &&
        (isCustom ? op.alias.includes('∅') : !op.alias.includes('∅')),
    )?.alias;

    this.selectedOperator.set(operatorAlias);
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
      this.hsFiltersService.removeFilter(this.parent, this._filter);
    } else {
      this.deleteRuleFilter();
    }
    this.emitChange();
  }

  /**
   * Toggles the value source between value and property
   * @param source The source to toggle to
   */
  toggleValueSource(source: 'value' | 'property'): void {
    this.valueSource.set(source);
    this.emitChange();
  }
}
