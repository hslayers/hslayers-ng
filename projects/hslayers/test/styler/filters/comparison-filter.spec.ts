import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {HsComparisonFilterComponent} from 'hslayers-ng/components/styler';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {MockHsLayerSelectorService} from 'hslayers-ng/test/layer-manager/layer-selector.service.mock';
import {mockLayerUtilsService} from 'hslayers-ng/test/layer-utils.service.mock';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {skip, take} from 'rxjs';

describe('ComparisonFilterComponent', () => {
  let component: HsComparisonFilterComponent;
  let fixture: ComponentFixture<HsComparisonFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, HsComparisonFilterComponent],
      providers: [
        // ... other test providers
        provideHttpClientTesting(),
        provideHttpClientTesting(),
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
        {
          provide: HsLayerSelectorService,
          useClass: MockHsLayerSelectorService,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsComparisonFilterComponent);
    component = fixture.componentInstance;
    component.filter = ['>', 'attr1', 'value'];
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger side effects when attribute changes', fakeAsync(() => {
    spyOn(component, 'emitChange');

    component.attributeControl.setValue('attribute1');
    tick(500);
    fixture.detectChanges();

    expect(component.emitChange).toHaveBeenCalled();
  }));

  it('should initialize with default operators or empty', fakeAsync(() => {
    component.operators.pipe(take(1)).subscribe((operators) => {
      expect(operators).toEqual(['==', '*=', '!=', '<', '<=', '>', '>=']); // Assuming it should be empty on init
    });

    tick();
    fixture.detectChanges();
  }));

  it('should update operators correctly based on selected attribute - string based', fakeAsync(() => {
    component.operators.pipe(skip(1), take(1)).subscribe((operators) => {
      expect(operators).toEqual(['==', '*=', '!=']);
    });

    // Simulate selecting a stringBased attribute
    component.attributeControl.setValue('stringBased');
    tick(500); // Advance the virtual time
    fixture.detectChanges();
  }));

  it('should update operators correctly based on selected attribute - numeric', fakeAsync(() => {
    component.operators.pipe(skip(1), take(1)).subscribe((operators) => {
      expect(operators).toEqual(['==', '*=', '!=', '<', '<=', '>', '>=']);
    });

    // Simulate selecting a numeric attribute
    component.attributeControl.setValue('numeric');
    tick(500); // Advance the virtual time
    fixture.detectChanges();
  }));
});
