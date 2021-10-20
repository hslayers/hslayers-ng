import {Component, Inject, HostListener, ViewEncapsulation} from '@angular/core';

import {HsMatSlideshowRef} from './slideshow-ref';
import {SLIDESHOW_DATA} from './slideshow.tokens';

@Component({
  selector: 'hs-mat-slideshow',
  templateUrl: './slideshow.html',
  styleUrls: ['slideshow.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HsMatSlideshowComponent {
  @HostListener('document:keydown', ['$event']) private handleKeydown(event: KeyboardEvent) {
    switch (event.code) {
      case 'ArrowLeft':
      case 'ArrowDown':
        this.prevSlide();
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        this.nextSlide();
        break;
      case 'Escape':
        this.dialogRef.close();
    }
  }

  currentSlide: number = 0;

  nextSlide(): void {
    const notLastSlide = Number(this.currentSlide !== this.gallery.length - 1);
    this.currentSlide = (this.currentSlide + 1) * notLastSlide;
  }

  prevSlide(): void {
    const isFirstSlide = Number(this.currentSlide === 0);
    this.currentSlide = this.currentSlide + this.gallery.length * isFirstSlide - 1;
  }

  constructor(
    public dialogRef: HsMatSlideshowRef,
    @Inject(SLIDESHOW_DATA) public gallery: any
  ) {}
}
