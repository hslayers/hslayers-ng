import {Component, Input, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownButtonItem,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {FillSymbolizer, SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {Kinds} from '../symbolizer-kind.enum';
import {HsColorPickerComponent} from '../color-picker/color-picker.component';
import {HsSliderComponent} from '../slider/slider.component';
import {HsMarkSymbolizerComponent} from '../mark-symbolizer/mark-symbolizer.component';
import {HsIconSymbolizerComponent} from '../icon-symbolizer/icon-symbolizer.component';

@Component({
  selector: 'hs-fill-symbolizer',
  templateUrl: './fill-symbolizer.component.html',
  styles: [
    `
      hs-symbolizer-color-picker.disabled {
        color: lightgray;
      }
    `,
  ],
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
export class HsFillSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: FillSymbolizer;
  @ViewChild('graphicFillMenu') menuRef;
  kinds = Kinds;

  addSymbolizer(attribute: string, kind: SymbolizerKind): void {
    const symbolizer = {kind, color: '#000000', opacity: 1};
    if (kind == Kinds.icon) {
      Object.assign(symbolizer, {
        offset: [0.5, 0.5],
        size: 20,
        image: 'assets/img/icons/information78.svg',
      });
    }
    if (kind == Kinds.mark) {
      Object.assign(symbolizer, {
        wellKnownName: 'circle',
        radius: 7,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeOpacity: 0.25,
        strokeWidth: 2,
      });
    }
    this.symbolizer[attribute] = symbolizer;
    this.menuRef.close();
    this.emitChange();
  }
}
