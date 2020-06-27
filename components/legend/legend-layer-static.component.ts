import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'hs-legend-layer-static',
  template: require('./partials/layer-static-directive.html')
})
export class HsLegendLayerStaticComponent {
  @Input() layer: any;
  lastLegendImage: any;
  legendType: string;
  svgContent: SafeHtml;
  legendImage: string;

  constructor(private sanitizer: DomSanitizer) {
  }

  fillContent() {
    const legendImage = this.layer.lyr.get('legendImage');
    if (legendImage) {
      this.lastLegendImage = legendImage;
      if (legendImage.indexOf('<svg') > -1) {
        this.legendType = 'svg';
        this.svgContent = this.sanitizer.bypassSecurityTrustHtml(legendImage);
      } else {
        this.legendType = 'image';
        this.legendImage = legendImage;
      }
    }
  }

  ngOnInit() {
    
    if (this.layer.lyr.get('legendImage')) {
      this.fillContent();
    }
    this.layer.lyr.on('change', (e) => {
      //TODO: Maybe rewrite this to something more fancy like Observable
      if(this.layer.lyr.get('legendImage') != this.lastLegendImage) {
        this.fillContent()
      }
    });
  }

}