import {Component, Input, OnInit} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import LegendRenderer from 'geostyler-legend/dist/LegendRenderer/LegendRenderer';
import {Style as GeoStylerStyle} from 'geostyler-style';

import {HsStylerService} from '../../styler.service';

@Component({
  selector: 'hs-rule-list-item',
  templateUrl: 'rule-list-item.component.html',
  styleUrls: ['../../styler.component.scss'],
})
export class HsRuleListItemComponent implements OnInit {
  @Input() rule: any;
  @Input() app = 'default';
  ruleVisible = false;
  svg: SafeHtml;

  constructor(
    public hsStylerService: HsStylerService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.generateLegend();
  }

  async generateLegend() {
    const obj: GeoStylerStyle = {name: '', rules: [this.rule]};
    const legendOpts: any = {
      styles: [obj],
      size: [50, 35],
      hideRect: true,
    };
    const legendRenderer = (LegendRenderer as any).default
      ? new (LegendRenderer as any).default(legendOpts)
      : new LegendRenderer(legendOpts);
    const el = document.createElement('div');
    await legendRenderer.render(el);
    this.svg = this.sanitizer.bypassSecurityTrustHtml(el.innerHTML);
  }
}
