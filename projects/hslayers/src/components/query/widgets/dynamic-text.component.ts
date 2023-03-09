import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsLayerDescriptor} from '../../layermanager/layer-descriptor.interface';
import {HsQueryPopupWidgetBaseComponent} from '../query-popup-widget-base.component';
import {getPopUp} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-dynamic-text',
  templateUrl: './dynamic-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsDynamicTextComponent
  extends HsQueryPopupWidgetBaseComponent
  implements OnInit
{
  layerDescriptor: any;
  name = 'dynamic-text';

  @Input() data: {
    layerDescriptor: HsLayerDescriptor;
  };

  constructor(private sanitizer: DomSanitizer) {
    super();
  }
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
      this.layerDescriptor.layer
    ).displayFunction;
    const content = displayFunction(feature);
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
