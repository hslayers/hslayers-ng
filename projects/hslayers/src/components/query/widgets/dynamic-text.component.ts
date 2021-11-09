import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsQueryPopupWidgetBaseComponent} from '../query-popup-widget-base.component';
import {getPopUp} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-dynamic-text',
  templateUrl: './dynamic-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsDynamicTextComponent
  extends HsQueryPopupWidgetBaseComponent
  implements OnInit {
  layerDescriptor: any;
  name = 'dynamic-text';

  @Input() data: {
    layerDescriptor: any;
  };

  constructor(
    public hsLayerUtilsService: HsLayerUtilsService,
    private sanitizer: DomSanitizer
  ) {
    super();
  }
  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
  }
  generateContent(feature: Feature<Geometry>) {
    const displayFunction = getPopUp(
      this.layerDescriptor.layer
    ).displayFunction;
    const content = displayFunction(feature);
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
