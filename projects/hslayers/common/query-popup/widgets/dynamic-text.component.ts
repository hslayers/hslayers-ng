import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsQueryPopupWidgetBaseComponent} from '../query-popup-widget-base.component';
import {getPopUp} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-dynamic-text',
  templateUrl: './dynamic-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HsDynamicTextComponent
  extends HsQueryPopupWidgetBaseComponent
  implements OnInit
{
  private sanitizer = inject(DomSanitizer);

  layerDescriptor: any;
  name = 'dynamic-text';

  @Input() data: {
    layerDescriptor: HsLayerDescriptor;
  };

  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
  }

  /**
   * Generate dynamic text content using display function
   * @param feature - Feature selected
   * @returns Safe HTML
   */
  generateContent(feature: Feature<Geometry>): SafeHtml {
    const displayFunction = getPopUp(
      this.layerDescriptor.layer,
    ).displayFunction;
    const content = displayFunction(feature);
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
