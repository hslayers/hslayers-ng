import {By} from '@angular/platform-browser';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {
  HsAddFilterButtonComponent,
  HsFiltersComponent,
  HsFiltersService,
} from 'hslayers-ng/components/styler';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

describe('StylerFiltersComponent', () => {
  let component: HsFiltersComponent;
  let fixture: ComponentFixture<HsFiltersComponent>;
  let filtersService: HsFiltersService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HsFiltersComponent, HsAddFilterButtonComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HsFiltersService,
      ],
      imports: [TranslateCustomPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(HsFiltersComponent);
    component = fixture.componentInstance;
    component.rule = {
      name: 'Untitled rule',
      symbolizers: [],
    };
    filtersService = TestBed.inject(HsFiltersService);
    fixture.detectChanges(); // Ensure Angular processes all bindings
    await fixture.whenStable(); // Wait for async tasks to complete
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the rule filter correctly when a filter is added', () => {
    spyOn(component, 'add').and.callThrough(); // Spy on the add method in the component
    spyOn(filtersService, 'add').and.callThrough(); // Spy on the add method in the service

    // Create a mock event object with the required properties
    const mockEvent = {type: 'COMPARE'};

    // Simulate button click to add filter
    const button: DebugElement = fixture.debugElement.query(
      By.css('hs-add-filter-button'),
    );
    expect(button).toBeTruthy(); // Ensure the button exists in the DOM

    button.triggerEventHandler('clicks', mockEvent);

    expect(filtersService.add).toHaveBeenCalled();
    expect(component.rule.filter).toEqual(['==', undefined, '<value>']);
  });

  it('should emit change when filter is updated', () => {
    spyOn(component.changes, 'emit');

    component.emitChange();

    expect(component.changes.emit).toHaveBeenCalled();
  });
});
