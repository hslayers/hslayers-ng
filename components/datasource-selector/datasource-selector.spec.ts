import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {TranslateModule} from '@ngx-translate/core';

import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {HsAddLayersVectorService} from '../add-layers/vector/add-layers-vector.service';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsConfig} from '../../config.service';
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

class endpointsServiceMock {
  endpoints = [];
  constructor() {}
}

class WindowMock {
  innerWidth: any;
  constructor() {}
}

describe('HsDatasources', () => {
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
      imports: [FormsModule, TranslateModule.forRoot()],
      declarations: [HsDatasourcesComponent, EndpointsWithDatasourcesPipe],
      providers: [
        HsDatasourcesService,
        {provide: HsAddLayersVectorService, useValue: new emptyMock()},
        {
          provide: HsCommonEndpointsService,
          useValue: new endpointsServiceMock(),
        },
        {provide: HsConfig, useValue: new emptyMock()},
        {provide: HsLayoutService, useValue: new emptyMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: EndpointsWithDatasourcesPipe,
          useValue: {
            transform: () => [],
          },
        },
        {provide: HttpClient, useValue: new emptyMock()},
        {provide: Window, useValue: new WindowMock()},
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsDatasourcesComponent);
    service = TestBed.get(HsDatasourcesService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('decompose metadata', () => {
    const emptyMetadata = 'empty';
    const decomposed1 = component.decomposeMetadata(emptyMetadata);
    expect(decomposed1).toBeDefined();
    expect(decomposed1).toBeFalse();

    //TODO: add test for some real-life metadata example
  });
});
