import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HsConfig } from './config.service';

import { HslayersComponent } from './hslayers.component';

class HsConfigMock {
  layer_order = '-position';
  constructor() {}
}

describe('HslayersComponent', () => {
  let component: HslayersComponent;
  let fixture: ComponentFixture<HslayersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HslayersComponent ],
      providers: [{provide: HsConfig, useValue: new HsConfigMock()},]
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
