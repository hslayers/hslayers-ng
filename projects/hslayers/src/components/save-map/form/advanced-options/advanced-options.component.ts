import {BoundingBoxObject} from '../../types/bounding-box-object.type';
import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {
  ControlContainer,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {HsMapService} from '../../../map/map.service';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {
  getShowInLayerManager,
  getTitle,
} from '../../../../common/layer-extensions';

export type saveMapLayer = {
  checked: boolean;
  layer: Layer<Source>;
  title: string;
};

@Component({
  selector: 'hs-save-map-advanced-options',
  templateUrl: './advanced-options.component.html',
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, {skipSelf: true}),
    },
  ],
})
export class AdvancedOptionsComponent implements OnInit, OnDestroy {
  layers: saveMapLayer[];
  btnSelectDeselectClicked = true;
  constructor(
    public parentContainer: ControlContainer,
    private fb: FormBuilder,
    private hsMapService: HsMapService,
  ) {}

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup;
  }
  visible = false;
  ngOnInit() {
    this.fillCompositionLayers();
    this.parentFormGroup.addControl(
      'bbox',
      new FormGroup({
        east: new FormControl(0),
        south: new FormControl(0),
        west: new FormControl(0),
        north: new FormControl(0),
      }),
    );

    this.setCurrentBoundingBox();

    console.log(this.parentFormGroup);
    this.parentFormGroup.addControl(
      'layers',
      new FormControl<saveMapLayer['layer'][]>(this.flattenValues()),
    );
  }

  ngOnDestroy() {
    this.parentFormGroup.removeControl('bbox');
    this.parentFormGroup.removeControl('layers');
  }

  /**
   * Set composition's data bounding box to the current OL map view extent
   */
  setCurrentBoundingBox(): void {
    this.parentFormGroup.patchValue({bbox: this.hsMapService.describeExtent()});
  }

  onChecklistChange(checked: boolean, layer: saveMapLayer) {
    layer.checked = checked;
    this.parentFormGroup.get('layers').setValue(this.flattenValues());
  }

  flattenValues() {
    return this.layers.filter((l) => l.checked).map((l) => l.layer);
  }

  fillCompositionLayers() {
    this.layers = this.hsMapService
      .getMap()
      .getLayers()
      .getArray()
      .filter(
        (lyr: Layer<Source>) =>
          getShowInLayerManager(lyr) == undefined ||
          getShowInLayerManager(lyr) == true,
      )
      .map((lyr: Layer<Source>) => {
        return {
          title: getTitle(lyr),
          checked: this.btnSelectDeselectClicked,
          layer: lyr,
        };
      })
      .sort((a, b) => {
        return a.layer.getZIndex() - b.layer.getZIndex();
      });
  }

  /**
   * Select or deselect all available composition's layers
   */
  toggleLayers(): void {
    this.btnSelectDeselectClicked = !this.btnSelectDeselectClicked;
    this.layers = this.layers.map((l) => {
      return {...l, checked: this.btnSelectDeselectClicked};
    });
    this.parentFormGroup.get('layers').setValue(this.flattenValues());
  }
}
