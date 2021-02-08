import {Component, Input} from '@angular/core';
import {
  DomSanitizer,
  SafeHtml,
  SafeResourceUrl,
} from '@angular/platform-browser';
import {getLegends} from '../../common/layer-extensions';

@Component({
  selector: 'hs-legend-layer-static',
  templateUrl: './partials/layer-static-directive.html',
})
export class HsLegendLayerStaticComponent {
  @Input() layer: any;
  lastLegendImage: any;
  legendType: string;
  svgContent: SafeHtml;
  legendImage: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  fillContent(): void {
    let legendImage = getLegends(this.layer.lyr);
    if (Array.isArray(legendImage)) {
      legendImage = legendImage[0];
    }
    if (legendImage) {
      this.lastLegendImage = legendImage;
      if (legendImage.indexOf('<svg') > -1) {
        this.legendType = 'svg';
        this.svgContent = this.sanitizer.bypassSecurityTrustHtml(legendImage);
      } else {
        this.legendType = 'image';
        this.legendImage = this.sanitizer.bypassSecurityTrustResourceUrl(
          legendImage
        );
      }
    }
  }

  ngOnInit(): void {
    if (getLegends(this.layer.lyr)) {
      this.fillContent();
    }
    this.layer.lyr.on('change', (e) => {
      //TODO: Maybe rewrite this to something more fancy like Observable
      if (getLegends(this.layer.lyr) != this.lastLegendImage) {
        this.fillContent();
      }
    });
  }
}
