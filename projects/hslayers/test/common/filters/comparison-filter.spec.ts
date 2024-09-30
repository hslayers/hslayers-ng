import {BehaviorSubject, firstValueFrom, of} from 'rxjs';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
  tick,
} from '@angular/core/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Filter} from 'hslayers-ng/types';
import {
  HsComparisonFilterComponent,
  HsFiltersService,
} from 'hslayers-ng/common/filters';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {Point} from 'ol/geom';
import {WfsFeatureAttribute} from 'hslayers-ng/types';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

class MockHsFiltersService {
  selectedLayer = {
    layer: new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new Point([0, 0]),
            attr1: 'value1',
            attr2: 50,
          }),
          new Feature({
            geometry: new Point([1, 1]),
            attr1: 'value2',
            attr2: 75,
          }),
        ],
      }),
    }),
  };
  layerAttributes: WfsFeatureAttribute[] = [
    {name: 'attr1', type: 'string', isNumeric: false},
    {name: 'attr2', type: 'number', isNumeric: true},
  ];
  getAttributeWithValues(attributeName: string) {
    const attr = this.layerAttributes.find((a) => a.name === attributeName);
    if (attr.name === 'attr1') {
      return of({...attr, values: ['value1', 'value2']});
    } else if (attr.name === 'attr2') {
      return of({...attr, range: {min: 0, max: 100}});
    }
    return of(attr);
  }

  getSortedUniqueValues(values: any[]): any[] {
    const uniqueValues = [...new Set(values)];
    return uniqueValues.sort((a, b) => {
      if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
      }
      return a - b;
    });
  }

  removeFilter(parent: Filter, filter: Filter): boolean {
    const index = parent.findIndex((item) => item === filter);
    parent.splice(index, 1);
    return true;
  }
}

class MockHsLayerUtilsService {
  listAttributes() {
    return ['attr1', 'attr2'];
  }
}

class MockHsLayoutService {
  mainpanel$ = new BehaviorSubject<string>('wfsFilter');

  setMainPanel(panel: string) {
    this.mainpanel$.next(panel);
  }
}

describe('HsComparisonFilterComponent', () => {
  let component: HsComparisonFilterComponent;
  let fixture: ComponentFixture<HsComparisonFilterComponent>;
  let filtersService: MockHsFiltersService;
  let layoutService: MockHsLayoutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, HsComparisonFilterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: HsFiltersService, useClass: MockHsFiltersService},
        {provide: HsLayerUtilsService, useClass: MockHsLayerUtilsService},
        {provide: HsLayoutService, useClass: MockHsLayoutService},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HsComparisonFilterComponent);
    component = fixture.componentInstance;
    component.filter = ['==', 'attr1', 'value'];

    filtersService = TestBed.inject(HsFiltersService) as any;
    layoutService = TestBed.inject(HsLayoutService) as any;
    fixture.detectChanges();
  });

  describe('filterContext', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should update operators when selecting a numeric attribute', fakeAsync(async () => {
      const operatorsPromise = firstValueFrom(component.operators);

      component.attributeControl.setValue('attr2');
      tick();
      fixture.detectChanges();

      const ops = await operatorsPromise;
      tick(1000);
      fixture.detectChanges();

      expect(ops.map((op) => op.value)).toEqual([
        '==',
        '!=',
        '<',
        '<=',
        '>',
        '>=',
      ]);
    }));

    it('should update currentAttribute when selecting an attribute', fakeAsync(() => {
      component.attributeControl.setValue('attr1');
      tick();
      fixture.detectChanges();
      expect(component.currentAttribute().name).toBe('attr1');
      expect(component.currentAttribute().values).toEqual(['value1', 'value2']);
      flush();
    }));

    it('should handle numeric attributes with range', fakeAsync(async () => {
      component.attributeControl.setValue('attr2');
      tick(1000);
      fixture.detectChanges();

      expect(component.currentAttribute().name).toBe('attr2');
      expect(component.currentAttribute().range).toEqual({min: 0, max: 100});

      tick(250); // wait for debounceTime in filter-range-input to finish
    }));

    it('should remove filter when remove() is called', () => {
      const parentMock = [
        '&&',
        component.filter,
        ['==', 'attr2', 'value2'],
      ] as Filter;
      component.parent = parentMock;
      spyOn(component, 'emitChange');
      component.remove();
      expect(parentMock.length).toBe(2);
      expect(component.emitChange).toHaveBeenCalled();
    });

    it('should update features and attributes when updateFeatures() is called', () => {
      component.updateFeatures();
      expect(component.attributes).toEqual(['attr1', 'attr2']);
    });
  });

  describe('stylerContext', () => {
    beforeEach(() => {
      layoutService.setMainPanel('styler');
    });

    it('should set isWfsFilter to false', fakeAsync(() => {
      tick();
      expect(component.isWfsFilter()).toBeFalse();
    }));

    it('should initialize attributes from features when not in WFS context', fakeAsync(() => {
      component.updateFeatures();
      tick();
      expect(component.attributes).toEqual(['attr1', 'attr2']);
      expect(component.currentAttribute().type).toBe('string');
    }));

    it('should get values for numeric attributes from features', fakeAsync(() => {
      component.attributeControl.setValue('attr2');
      tick();
      fixture.detectChanges();

      expect(component.currentAttribute().name).toBe('attr2');
      expect(component.currentAttribute().isNumeric).toBeTrue();
      expect(component.currentAttribute().range).toEqual({min: 50, max: 75});

      tick(250); // wait for debounceTime in filter-range-input to finish
    }));

    it('should get values for string attributes from features', fakeAsync(() => {
      component.attributeControl.setValue('attr1');
      tick();
      fixture.detectChanges();

      expect(component.currentAttribute().name).toBe('attr1');
      expect(component.currentAttribute().isNumeric).toBeFalse();
      expect(component.currentAttribute().values).toEqual(['value1', 'value2']);
    }));
  });
});
