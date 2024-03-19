import {Component, Input, OnDestroy, OnInit, inject} from '@angular/core';
import {
  ControlContainer,
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsMapService} from 'hslayers-ng/services/map';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {getShowInLayerManager, getTitle} from 'hslayers-ng/common/extensions';

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
  @Input() thumbnail: HTMLImageElement;

  layers: saveMapLayer[];
  btnSelectDeselectClicked = true;

  postCompose = this.hsUtilsService.debounce(
    () => {
      this.setCurrentBoundingBox();
      this.hsSaveMapService.generateThumbnail(this.thumbnail);
    },
    1000,
    false,
    this,
  );

  constructor(
    public parentContainer: ControlContainer,
    private fb: FormBuilder,
    private hsMapService: HsMapService,
    private hsUtilsService: HsUtilsService,
    private hsSaveMapService: HsSaveMapService,
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
    //Not using postCompose method because of the delay
    this.setCurrentBoundingBox();
    this.hsSaveMapService.generateThumbnail(this.thumbnail);

    this.parentFormGroup.addControl(
      'layers',
      new FormControl<saveMapLayer['layer'][]>(this.flattenValues()),
    );

    this.hsMapService.getMap().on('postcompose', this.postCompose);
  }

  ngOnDestroy() {
    this.parentFormGroup.removeControl('bbox');
    this.parentFormGroup.removeControl('layers');
    this.hsMapService.getMap().un('postcompose', this.postCompose);
  }

  /**
   * Set composition's data bounding box to the current OL map view extent
   */
  setCurrentBoundingBox(): void {
    this.parentFormGroup.patchValue({bbox: this.hsMapService.describeExtent()});
  }

  onChecklistChange(checked: boolean, layer: saveMapLayer): void {
    layer.checked = checked;
    this.parentFormGroup.get('layers').setValue(this.flattenValues());
  }

  /**
   * Flatten saveMapLayer type object list into simply OL layer array of selected layers
   */
  private flattenValues(): Layer<Source>[] {
    return this.layers.filter((l) => l.checked).map((l) => l.layer);
  }

  /**
   * Get layers which might be saved into composition
   */
  fillCompositionLayers(): void {
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
