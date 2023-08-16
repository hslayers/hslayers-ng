import {ComponentFixture, TestBed, async} from '@angular/core/testing';

import {HsMatLayoutComponent} from './layout.component';

describe('LayoutComponent', () => {
  let component: HsMatLayoutComponent;
  let fixture: ComponentFixture<HsMatLayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HsMatLayoutComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HsMatLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
