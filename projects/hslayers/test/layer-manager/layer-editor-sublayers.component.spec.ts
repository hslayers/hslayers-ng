import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from '../config.service.mock';

import {
  HsLayerEditorSubLayerCheckboxesComponent,
  HsLayerEditorSublayerService,
} from 'hslayers-ng/components/layer-manager';
import {HsLayerManagerVisibilityService} from 'hslayers-ng/services/layer-manager';
import {HsSublayer} from 'hslayers-ng/types';

const layerEditorSublayerServiceSpy = jasmine.createSpyObj(
  'HsLayerEditorSublayerService',
  ['subLayerSelected'],
);
const layerManagerVisibilityServiceSpy = jasmine.createSpyObj(
  'HsLayerManagerVisibilityService',
  ['changeLayerVisibility'],
);

describe('HsLayerEditorSubLayerCheckboxesComponent', () => {
  let component: HsLayerEditorSubLayerCheckboxesComponent;
  let fixture: ComponentFixture<HsLayerEditorSubLayerCheckboxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, HsLayerEditorSubLayerCheckboxesComponent],
      providers: [
        {
          provide: HsLayerEditorSublayerService,
          useValue: layerEditorSublayerServiceSpy,
        },
        {
          provide: HsLayerManagerVisibilityService,
          useValue: layerManagerVisibilityServiceSpy,
        },
        {provide: HsConfig, useValue: new HsConfigMock()},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HsLayerEditorSubLayerCheckboxesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize app property', () => {
    component.ngOnInit();
    expect(component.app).toBe('testappid');
  });

  it('should toggle expanded state', () => {
    expect(component.expanded).toBeFalse();
    component.toggleExpanded();
    expect(component.expanded).toBeTrue();
    component.toggleExpanded();
    expect(component.expanded).toBeFalse();
  });

  it('should handle subLayerSelected', () => {
    const mockSubLayer: HsSublayer = {
      name: 'testLayer',
      title: 'Test Layer',
      visible: false,
      previousVisible: undefined,
    };
    const mockParent: HsSublayer = {
      name: 'parentLayer',
      title: 'Parent Layer',
      visible: false,
      previousVisible: undefined,
      sublayers: [mockSubLayer],
    };

    component.subLayerSelected(mockSubLayer, mockParent);

    expect(layerEditorSublayerServiceSpy.subLayerSelected).toHaveBeenCalled();
    expect(mockParent.visible).toBeFalse();
  });

  it('should update nested sublayers when parent is toggled', () => {
    const mockSubLayer: HsSublayer = {
      name: 'testLayer',
      title: 'Test Layer',
      visible: true,
      previousVisible: undefined,
      sublayers: [
        {
          name: 'nestedLayer1',
          title: 'Nested Layer 1',
          visible: false,
          previousVisible: undefined,
        },
        {
          name: 'nestedLayer2',
          title: 'Nested Layer 2',
          visible: false,
          previousVisible: undefined,
        },
      ],
    };

    component.subLayerSelected(mockSubLayer);

    expect(layerEditorSublayerServiceSpy.subLayerSelected).toHaveBeenCalled();
    expect(mockSubLayer.sublayers[0].visible).toBeTrue();
    expect(mockSubLayer.sublayers[1].visible).toBeTrue();
  });

  it('should adjust parent based on sublayer visibility', () => {
    const mockSubLayer: HsSublayer = {
      name: 'testLayer',
      title: 'Test Layer',
      visible: true,
      previousVisible: undefined,
      sublayers: [
        {
          name: 'nestedLayer1',
          title: 'Nested Layer 1',
          visible: false,
          previousVisible: undefined,
        },
        {
          name: 'nestedLayer2',
          title: 'Nested Layer 2',
          visible: false,
          previousVisible: undefined,
        },
      ],
    };

    component.subLayerSelected(mockSubLayer.sublayers[0], mockSubLayer);
    expect(mockSubLayer.visible).toBeFalse();
  });
});
