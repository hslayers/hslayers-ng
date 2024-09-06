import {HsFiltersService} from 'hslayers-ng/common/filters/filters.service';
import {HsLayerDescriptor, WfsFeatureAttribute} from 'hslayers-ng/types';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {Layer} from 'ol/layer';
import {TestBed} from '@angular/core/testing';
import {Vector as VectorSource} from 'ol/source';
import {firstValueFrom} from 'rxjs';
import {provideHttpClient} from '@angular/common/http';

function getMockXmlResponse(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
          <wfs:ValueCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" 
                              xmlns:gml="http://www.opengis.net/gml/3.2"
                              xmlns:bldg="http://www.opengis.net/citygml/building/2.0"
                              xmlns:gen="http://www.opengis.net/citygml/generics/2.0"
                              timeStamp="2024-03-15T12:00:00Z" numberReturned="2">
            <wfs:member>
              <gen:buildingType>
                Residential
              </gen:buildingType>
            </wfs:member>
            <wfs:member>
              <gen:buildingType>
                123 Main St
              </gen:buildingType>
            </wfs:member>
          </wfs:ValueCollection>`;
}

describe('HsFiltersService', () => {
  let service: HsFiltersService;
  let httpMock: HttpTestingController;
  let olLayer: Layer<VectorSource>;
  let utilsService: jasmine.SpyObj<HsUtilsService>;

  beforeEach(() => {
    const utilsServiceSpy = jasmine.createSpyObj('HsUtilsService', ['proxify']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HsFiltersService,
        {provide: HsUtilsService, useValue: utilsServiceSpy},
      ],
    });
    service = TestBed.inject(HsFiltersService);
    httpMock = TestBed.inject(HttpTestingController);
    utilsService = TestBed.inject(
      HsUtilsService,
    ) as jasmine.SpyObj<HsUtilsService>;

    // Create a proper OpenLayers layer
    const vectorSource = new VectorSource();
    olLayer = new Layer({
      source: vectorSource,
      properties: {
        layerName: 'gen:layer',
        wfsUrl: 'http://test.com/wfs',
      },
    });

    // Set the selectedLayer with the proper OpenLayers layer
    service.selectedLayer = {
      layer: olLayer,
    } as HsLayerDescriptor;

    // Set up utilsService.proxify spy
    utilsService.proxify.and.callFake((url: string) => url);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add filters correctly', () => {
    const collection: any[] = [];

    service.add('OR', false, collection);
    expect(collection.length).toBe(3);
    expect(collection[1].length).toBe(3);
    expect(collection[2].length).toBe(3);
    expect(collection[0]).toBe('||');
    expect(collection[1][0]).toBe('==');

    service.add('COMPARE', true, collection);
    expect(collection.length).toBe(4);
    expect(collection[3][0]).toBe('==');

    service.add('AND', true, collection);
    expect(collection.length).toBe(5);
    expect(Array.isArray(collection[4][1])).toBeTrue();
  });

  it('should convert logical operators to human-readable format', () => {
    expect(service.humanReadableLogOp('&&')).toBe('AND');
    expect(service.humanReadableLogOp('||')).toBe('OR');
    expect(service.humanReadableLogOp('!')).toBe('NOT');
  });

  it('should check if filter is a logical operator', () => {
    expect(service.isLogOp(['&&', ['==', 'attr', 'value']])).toBeTrue();
    expect(service.isLogOp(['==', 'attr', 'value'])).toBeFalse();
  });

  it('should handle XML response in getAttributeWithValues', async () => {
    const mockAttribute: WfsFeatureAttribute = {
      name: 'buildingType',
      type: 'string',
      isNumeric: false,
    };
    service.layerAttributes = [mockAttribute];

    const getAttributeWithValuesPromise = firstValueFrom(
      service.getAttributeWithValues(mockAttribute.name),
    );

    const expectedUrl =
      'http://test.com/wfs?service=WFS&version=2.0.0&request=GetPropertyValue&typename=gen:layer&valueReference=buildingType&outputFormat=application/json';
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush(getMockXmlResponse(), {
      headers: {'Content-Type': 'application/xml'},
    });
    const result = await getAttributeWithValuesPromise;
    expect(result.values[0]).toBe('123 Main St');
    expect(result.values[1]).toBe('Residential');
  });

  it('should handle numeric attributes in getAttributeWithValues', async () => {
    const mockAttribute: WfsFeatureAttribute = {
      name: 'attr1',
      type: 'number',
      isNumeric: true,
    };
    service.layerAttributes = [mockAttribute];

    const getAttributeWithValuesPromise = firstValueFrom(
      service.getAttributeWithValues(mockAttribute.name),
    );

    const expectedUrl =
      'http://test.com/wfs?service=WFS&version=2.0.0&request=GetPropertyValue&typename=gen:layer&valueReference=attr1&outputFormat=application/json';
    const req = httpMock.expectOne(expectedUrl);

    expect(req.request.method).toBe('GET');
    req.flush(
      {
        features: [
          {properties: {attr1: 2}},
          {properties: {attr1: 1}},
          {properties: {attr1: 3}},
        ],
      },
      {
        headers: {'Content-Type': 'application/json'},
      },
    );

    const result = await getAttributeWithValuesPromise;
    expect(result.name).toBe('attr1');
    expect(result.range).toEqual({min: 1, max: 3});
  });
});
