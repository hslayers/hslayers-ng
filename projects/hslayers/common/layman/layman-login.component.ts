import {Component, OnDestroy, OnInit, ViewRef} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Input} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsCommonLaymanService} from './layman.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';

@Component({
  selector: 'hs-layman-login',
  templateUrl: './layman-login.component.html',
})
export class HsLaymanLoginComponent
  implements HsDialogComponent, OnDestroy, OnInit
{
  @Input() data: {
    url: string;
  };
  viewRef: ViewRef;
  url: SafeResourceUrl;
  authChangeSubscription: Subscription;
  constructor(
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsDialogContainerService: HsDialogContainerService,
    private sanitizer: DomSanitizer,
  ) {
    this.authChangeSubscription =
      this.HsCommonLaymanService.authChange.subscribe(() => {
        this.close();
      });
  }
  ngOnDestroy(): void {
    this.authChangeSubscription.unsubscribe();
  }
  ngOnInit(): void {
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.url);
  }
  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
