import {ComponentFixture, TestBed, async} from '@angular/core/testing';

import {HsMatSlideshowComponent} from './slideshow.component';

describe('HsMatSlideshowComponent', () => {
  let component: HsMatSlideshowComponent;
  let fixture: ComponentFixture<HsMatSlideshowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HsMatSlideshowComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HsMatSlideshowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
