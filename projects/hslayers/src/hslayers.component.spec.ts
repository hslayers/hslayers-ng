import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {HsConfig} from './config.service';
import {HslayersComponent} from './hslayers.component';

class HsConfigMock {
  reverseLayerList = true;
  constructor() {}
}

describe('HslayersComponent', () => {
  let component: HslayersComponent;
  let fixture: ComponentFixture<HslayersComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [HslayersComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [{provide: HsConfig, useValue: new HsConfigMock()}],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HslayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
