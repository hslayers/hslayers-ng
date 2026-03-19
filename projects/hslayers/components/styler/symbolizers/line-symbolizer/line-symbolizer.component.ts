import {Component, Input, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownButtonItem,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';

import {LineSymbolizer, SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {Kinds} from '../symbolizer-kind.enum';
import {HsColorPickerComponent} from '../color-picker/color-picker.component';
import {HsSliderComponent} from '../slider/slider.component';
import {HsMarkSymbolizerComponent} from '../mark-symbolizer/mark-symbolizer.component';
import {HsIconSymbolizerComponent} from '../icon-symbolizer/icon-symbolizer.component';

@Component({
  selector: 'hs-line-symbolizer',
  templateUrl: './line-symbolizer.component.html',
  imports: [
    FormsModule,
    HsColorPickerComponent,
    HsSliderComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    HsMarkSymbolizerComponent,
    HsIconSymbolizerComponent,
    TranslatePipe,
  ],
})
export class HsLineSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: LineSymbolizer;
  @ViewChild('graphicLineMenu') lineMenuRef;
  @ViewChild('graphicStrokeMenu') strokeMenuRef;
  caps = ['butt', 'round', 'square'];
  joins = ['bevel', 'round', 'miter'];
  kinds = Kinds;

  addSymbolizer(attribute: string, kind: SymbolizerKind): void {
    this.symbolizer[attribute] = {kind};
    this.lineMenuRef.close();
    this.strokeMenuRef.close();
  }

  addDashItem(): void {
    if (!this.symbolizer.dasharray) {
      this.symbolizer.dasharray = [1];
    } else {
      this.symbolizer.dasharray.push(1);
    }
  }

  removeDashItem(): void {
    if (this.symbolizer.dasharray.length > 0) {
      this.symbolizer.dasharray.length--;
    }
  }
}
