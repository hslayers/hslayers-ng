import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HslayersComponent } from './hslayers.component';

describe('HslayersComponent', () => {
  let component: HslayersComponent;
  let fixture: ComponentFixture<HslayersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HslayersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HslayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
