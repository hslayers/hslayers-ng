import {CookieService} from 'ngx-cookie-service';
import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class HsHistoryListService {
  items: any = {};
  constructor(private CookieService: CookieService) {}
  readSourceHistory(forWhat: any): any {
    const sourceString = this.CookieService.get(`last${forWhat}Sources`);
    if (sourceString !== undefined) {
      this.items[forWhat] = this.uniq(JSON.stringify(sourceString));
    } else {
      this.items[forWhat] = [];
    }
    return this.items[forWhat];
  }
  /**
   * @param a
   */
  uniq(a: any): any {
    return a.sort().filter((item, pos, ary) => {
      return !pos || item != ary[pos - 1];
    });
  }

  addSourceHistory(forWhat: any, url: string): void {
    if (this.items[forWhat] === undefined) {
      this.items[forWhat] = [];
    }
    if (this.items[forWhat].indexOf(url) == -1) {
      this.items[forWhat].push(url);
      this.CookieService.set(
        `last${forWhat}Sources`,
        JSON.stringify(this.items[forWhat])
      );
    }
  }
}
