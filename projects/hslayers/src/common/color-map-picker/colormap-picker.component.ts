/* eslint-disable @typescript-eslint/no-empty-function */
import {Component, EventEmitter, Output, forwardRef} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

import colorScales from 'colormap/colorScale';
import {HsStylerService} from '../../components/styles/styler.service';

export type hsStylerColorMaps = {
  [name: string]: SVGSVGElement;
};

type hsStylerColorMapsKeyValue = {
  key: string;
  value: SVGSVGElement;
};

@Component({
  selector: 'hs-colormap-picker',
  templateUrl: './colormap-picker.component.html',
  styleUrls: ['./colormap-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      // eslint-disable-next-line no-use-before-define
      useExisting: forwardRef(() => ColormapPickerComponent),
      multi: true,
    },
  ],
})
export class ColormapPickerComponent implements ControlValueAccessor {
  _colorMaps: hsStylerColorMaps;
  //Value propagated to ngModel
  colorMap: string;
  //Internal, to be able to show selected map along with SVG
  _colorMap: hsStylerColorMapsKeyValue;
  menuVisible = false;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change = new EventEmitter<string>();

  constructor(private hsStylerService: HsStylerService) {}

  get colorMaps(): hsStylerColorMaps {
    if (!this._colorMaps) {
      this._colorMaps = this.createColorMaps();
    }
    return this._colorMaps;
  }

  onChange = (_: any) => {};
  onTouch = (_: any) => {};

  registerOnChange(providedFn) {
    this.onChange = providedFn;
  }

  registerOnTouched(providedFn) {
    this.onTouch = providedFn;
  }

  /**
   * If value changes from the outside of control
   * update component
   */
  writeValue(providedValue: string) {
    this.colorMap = providedValue;
    this._colorMap = {
      key: providedValue,
      value: this.colorMaps[providedValue],
    };
  }

  createColorMaps(): hsStylerColorMaps {
    const colorMap = {};
    for (const [name, colors] of Object.entries(colorScales)) {
      colorMap[name] = this.getColorMapSVG(name, colors);
    }
    return colorMap;
  }

  private getColorMapSVG(colormap: string, colors) {
    const rgbValues = colors.map((c) => c.rgb);
    return this.hsStylerService.generateSVGGradientForColorMap(rgbValues);
  }

  /**
   * Pick a colorMap
   */
  select(colorMapName: {key: string; value: SVGSVGElement}): void {
    this.menuVisible = false;
    this.colorMap = colorMapName.key;
    this._colorMap = colorMapName;
    this.onChange(this.colorMap);
    this.change.emit(this.colorMap);
  }
}
