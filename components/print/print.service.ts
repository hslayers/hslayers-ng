import {HsMapService} from '../map/map.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsPrintService {
  constructor(public HsMapService: HsMapService) {}

  /**
   * @memberof HsPrintService
   * @function print
   * @public
   * @param {string} title Heading of printed page
   * @description Basic print implementation
   */
  print(title: string): void {
    const canvas = this.HsMapService.getCanvas();
    const img = canvas.toDataURL('image/png');
    const win = window.open();
    const html = `<html><head></head><body><h2>${title}</h2><br><img src='${img}'/></body></html>`;
    win.document.write(html);
    setTimeout(() => {
      win.print();
      //win.location.reload();
    }, 250);
  }
}
