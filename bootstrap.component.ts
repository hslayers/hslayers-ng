import { Component, Inject, OnInit } from '@angular/core';
/**
 * This component is needed because we start the bootstrap 
 * process with Angular and when its completed, only then 
 * proceed with bootstraping of AngularJs application. 
 * Otherwise we cant use downgraded services in AngularJs 
 * components, because Angular modules are not yet bootstrapped (lazy)
 */
import { UpgradeModule } from '@angular/upgrade/static';

@Component({
  selector: 'hs',
  template: ``,
  styles: []
})
export class BootstrapComponent {
  public upgrade: UpgradeModule;
  constructor(upgrade: UpgradeModule) {
    this.upgrade = upgrade;
  }
}
