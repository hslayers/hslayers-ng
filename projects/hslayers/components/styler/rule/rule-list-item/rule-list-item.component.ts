import {Component, Input, OnInit, inject} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import LegendRenderer from 'geostyler-legend/dist/LegendRenderer/LegendRenderer';
import {Style as GeoStylerStyle} from 'geostyler-style';

import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsRuleComponent} from '../rule.component';

@Component({
  selector: 'hs-rule-list-item',
  templateUrl: 'rule-list-item.component.html',
  styleUrls: ['../../styler.component.scss'],
  imports: [FormsModule, NgClass, HsRuleComponent, TranslatePipe],
})
export class HsRuleListItemComponent implements OnInit {
  hsStylerService = inject(HsStylerService);
  private sanitizer = inject(DomSanitizer);

  @Input() rule: any;
  ruleVisible = false;
  svg: SafeHtml;

  ngOnInit(): void {
    this.generateLegend();
  }

  async generateLegend() {
    const obj: GeoStylerStyle = {name: '', rules: [this.rule]};
    const legendOpts: any = {
      styles: [obj],
      size: [47, 31],
      hideRect: true,
    };
    const legendRenderer = (LegendRenderer as any).default
      ? new (LegendRenderer as any).default(legendOpts)
      : new LegendRenderer(legendOpts);
    const el = document.createElement('div');
    await legendRenderer.render(el);
    const svgText = el.innerHTML
      .replace('0 0 47 35', '0 0 47 31')
      .replace('height="35"', 'height="31"');
    this.svg = this.sanitizer.bypassSecurityTrustHtml(svgText);
  }
}
