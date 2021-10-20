import {Injectable, Injector, ComponentRef} from '@angular/core';
import {Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal, PortalInjector} from '@angular/cdk/portal';

import {HsMatSlideshowComponent} from './slideshow.component';
import {HsMatSlideshowRef} from './slideshow-ref';
import {SLIDESHOW_DATA} from './slideshow.tokens';

interface HsMatSlideshowConfig {
  panelClass?: string;
  hasBackdrop?: boolean;
  backdropClass?: string;
  gallery?: HsMatSlideshowImage[]
}

export interface HsMatSlideshowImage {
  url: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}

const DEFAULT_CONFIG: HsMatSlideshowConfig = {
  hasBackdrop: true,
  backdropClass: 'hs-mat-backdrop',
  panelClass: 'hs-mat-slideshow-panel',
}

@Injectable()
export class HsMatSlideshowService {
  constructor(
    private injector: Injector,
    private overlay: Overlay
  ) {}

  open(config: HsMatSlideshowConfig = {}) {
    const dialogConfig = {...DEFAULT_CONFIG, ...config};
    const overlayRef = this.createOverlay(dialogConfig);
    const dialogRef = new HsMatSlideshowRef(overlayRef);

    const overlayComponent = this.attachDialogContainer(overlayRef, dialogConfig, dialogRef);
    dialogRef.componentInstance = overlayComponent;
    overlayRef.backdropClick().subscribe(_ => dialogRef.close());

    return dialogRef;
  }

  private attachDialogContainer(
    overlayRef: OverlayRef,
    config: HsMatSlideshowConfig,
    dialogRef: HsMatSlideshowRef
  ) {
    const injector = this.createInjector(config, dialogRef);

    const containerPortal = new ComponentPortal(HsMatSlideshowComponent, null, injector);
    const containerRef: ComponentRef<HsMatSlideshowComponent> = overlayRef.attach(containerPortal);

    return containerRef.instance;
  }

  private getOverlayConfig(config: HsMatSlideshowConfig): OverlayConfig {
    const positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally()
      .centerVertically();

    const overlayConfig = new OverlayConfig({
      hasBackdrop: config.hasBackdrop,
      backdropClass: config.backdropClass,
      panelClass: config.panelClass,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy
    });

    return overlayConfig;
  }

  private createOverlay(config: HsMatSlideshowConfig) {
    const overlayConfig = this.getOverlayConfig(config);
    return this.overlay.create(overlayConfig);
  }

  private createInjector(
    config: HsMatSlideshowConfig,
    dialogRef: HsMatSlideshowRef
  ): PortalInjector {
    const injectionTokens = new WeakMap();

    injectionTokens.set(HsMatSlideshowRef, dialogRef);
    injectionTokens.set(SLIDESHOW_DATA, config.gallery);

    return new PortalInjector(this.injector, injectionTokens);
  }
}
