import {
  BehaviorSubject,
  firstValueFrom,
  of,
  shareReplay,
  skip,
  take,
} from 'rxjs';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {
  HsComparisonFilterComponent,
  HsFiltersService,
} from 'hslayers-ng/common/filters';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {Point} from 'ol/geom';
import {WfsFeatureAttribute} from 'hslayers-ng/types';

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
      tick(500);
      fixture.detectChanges();

      const ops = await operatorsPromise;
      expect(ops).toEqual(['==', '*=', '!=', '<', '<=', '>', '>=']);
    }));

    it('should update currentAttribute when selecting an attribute', fakeAsync(() => {
      component.attributeControl.setValue('attr1');
      tick();
      fixture.detectChanges();
      expect(component.currentAttribute().name).toBe('attr1');
      expect(component.currentAttribute().values).toEqual(['value1', 'value2']);
    }));

    it('should handle numeric attributes with range', fakeAsync(() => {
      component.attributeControl.setValue('attr2');
      tick();
      fixture.detectChanges();

      expect(component.currentAttribute().name).toBe('attr2');
      expect(component.currentAttribute().range).toEqual({min: 0, max: 100});
    }));

    it('should remove filter when remove() is called', () => {
      const parentMock = ['&&', component.filter, ['==', 'attr2', 'value2']];
      component.parent = parentMock;
      spyOn(component, 'emitChange');
      component.remove();
      expect(parentMock.length).toBe(2);
      expect(component.emitChange).toHaveBeenCalled();
    });

    it('should update features and attributes when updateFeatures() is called', () => {
      console.log(component.isWfsFilter());
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
      expect(component.currentAttribute().type).toBe('unknown');
    }));

    it('should handle numeric attributes without fetching range', fakeAsync(() => {
      component.attributeControl.setValue('attr2');
      tick();
      fixture.detectChanges();

      expect(component.currentAttribute().name).toBe('attr2');
      expect(component.currentAttribute().isNumeric).toBeTrue();
      expect(component.currentAttribute().range).toBeUndefined();
    }));

    it('should handle string attributes without fetching values', fakeAsync(() => {
      component.attributeControl.setValue('attr1');
      tick();
      fixture.detectChanges();

      expect(component.currentAttribute().name).toBe('attr1');
      expect(component.currentAttribute().isNumeric).toBeFalse();
      expect(component.currentAttribute().values).toBeUndefined();
    }));
  });
});
