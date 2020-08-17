import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HsDatasourcesComponent} from './datasource-selector.component';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';

class emptyMock {
  constructor() {}
}

describe('HsDatasource', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  let fixture: ComponentFixture<HsDatasourcesComponent>;
  let component: HsDatasourcesComponent;
  let service: HsDatasourcesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [FormsModule],
      declarations: [HsDatasourcesComponent],
      providers: [
        HsDatasourcesService,
        {provide: HsLayoutService, useValue: new emptyMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsDatasourcesComponent);
    service = TestBed.get(HsDatasourcesService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('decompose metadata', () => {
    const metadata = '';
    const decomposed = component.decomposeMetadata(metadata);
    expect(decomposed).toBeTruthy(0);
  });
});
