import {InjectionToken} from '@angular/core';

import {HsMatSlideshowImage} from './slideshow.service';

export const SLIDESHOW_DATA = new InjectionToken<HsMatSlideshowImage[]>('SLIDESHOW_DATA');
