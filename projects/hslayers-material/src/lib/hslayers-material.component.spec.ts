import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HslayersMaterialComponent } from './hslayers-material.component';

describe('HslayersMaterialComponent', () => {
  let component: HslayersMaterialComponent;
  let fixture: ComponentFixture<HslayersMaterialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HslayersMaterialComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HslayersMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
