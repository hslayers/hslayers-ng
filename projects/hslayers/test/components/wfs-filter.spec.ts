import * as olFormatFilter from 'ol/format/filter';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Feature} from 'ol';
import {HsConfigMock} from '../config.service.mock';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsEventBusServiceMock} from '../event-bus.service.mock';
import {HsFiltersService} from 'hslayers-ng/common/filters';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from '../layout.service.mock';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {HsWfsFilterComponent} from 'hslayers-ng/components/wfs-filter/wfs-filter.component';
import {Point} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {WfsFeatureAttribute} from 'hslayers-ng/types';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

const HsLayerManagerServiceMock: jasmine.SpyObj<HsLayerManagerService> = {
  ...jasmine.createSpyObj('HsLayerManagerService', [
    'sortLayersByZ',
    'layerAdded',
  ]),
};

class MockHsFiltersService {
  selectedLayer = {
    layer: new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new Point([0, 0]),
            attr1: 'value1',
            attr2: 50,
          }),
          new Feature({
            geometry: new Point([1, 1]),
            attr1: 'value2',
            attr2: 75,
          }),
        ],
      }),
    }),
  };
  layerAttributes: WfsFeatureAttribute[] = [];
  setSelectedLayer(layer) {
    this.selectedLayer = layer;
  }
  setLayerAttributes(attributes: WfsFeatureAttribute[]) {
    this.layerAttributes = attributes;
  }
}

describe('HsWfsFilterComponent', () => {
  let component: HsWfsFilterComponent;
  let fixture: ComponentFixture<HsWfsFilterComponent>;
  let filtersService: MockHsFiltersService;

  beforeEach(async () => {
    const mockedConfig = new HsConfigMock();

    await TestBed.configureTestingModule({
      imports: [HsWfsFilterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: HsEventBusService, useValue: new HsEventBusServiceMock()},
        {provide: HsFiltersService, useClass: MockHsFiltersService},
        {provide: HsLayerManagerService, useValue: HsLayerManagerServiceMock},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HsWfsFilterComponent);
    filtersService = TestBed.inject(HsFiltersService) as any;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should correctly parse WFS DescribeFeatureType response', () => {
    const mockXmlResponse = `
      <xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml">
        <xsd:complexType name="featureType">
          <xsd:complexContent>
            <xsd:extension base="gml:AbstractFeatureType">
              <xsd:sequence>
                <xsd:element name="id" type="xsd:int"/>
                <xsd:element name="name" type="xsd:string"/>
                <xsd:element name="population" type="xsd:double"/>
                <xsd:element name="geom" type="gml:PointPropertyType"/>
              </xsd:sequence>
            </xsd:extension>
          </xsd:complexContent>
        </xsd:complexType>
      </xsd:schema>
    `;

    const result = component['parseWfsDescribeFeatureType'](
      mockXmlResponse,
      filtersService.selectedLayer.layer,
    );
    expect(result.attributes.map((attr) => attr.name)).not.toContain('geom');
    expect(result.attributes).toEqual([
      {name: 'id', type: 'xsd:int', isNumeric: true},
      {name: 'name', type: 'xsd:string', isNumeric: false},
      {name: 'population', type: 'xsd:double', isNumeric: true},
    ]);
    expect(result.geometryAttribute).toBe('geom');
  });

  it('should correctly identify geometry types', () => {
    const geometryTypes = [
      'gml:PointPropertyType',
      'gml:LineStringPropertyType',
      'gml:PolygonPropertyType',
      'gml:MultiPointPropertyType',
      'gml:MultiLineStringPropertyType',
      'gml:MultiPolygonPropertyType',
      'gml:GeometryPropertyType',
      'gml:SurfacePropertyType',
      'gml:MultiSurfacePropertyType',
      'gml:CurvePropertyType',
      'gml:MultiCurvePropertyType',
    ];

    geometryTypes.forEach((type) => {
      expect(component['isGeometryType'](type)).toBeTrue();
    });

    const nonGeometryTypes = [
      'xsd:string',
      'xsd:int',
      'xsd:double',
      'xsd:dateTime',
    ];

    nonGeometryTypes.forEach((type) => {
      expect(component['isGeometryType'](type)).toBeFalse();
    });
  });
});
