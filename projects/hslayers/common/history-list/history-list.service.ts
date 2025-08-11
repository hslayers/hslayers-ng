import {CookieService} from 'ngx-cookie-service';
import {Injectable, inject} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsHistoryListService {
  private cookieService = inject(CookieService);

  items: any = {};
  readSourceHistory(forWhat: string): Array<string> {
    if (forWhat !== undefined) {
      let sourceString = this.cookieService.get(`last${forWhat}Sources`);
      if (sourceString !== undefined) {
        this.items[forWhat] = {
          history: [],
        };
        if (sourceString !== '') {
          sourceString = sourceString.replace(/[\[\]\"]/gi, '');
          const historyArray = sourceString.split(',');
          for (const item of historyArray) {
            this.items[forWhat].history.push(item);
          }
        }
      } else {
        this.items[forWhat].history = [];
      }
      return this.items[forWhat].history;
    }
  }
  uniq(a: Array<string>): Array<string> {
    return a.sort().filter((item, pos, ary) => {
      return !pos || item != ary[pos - 1];
    });
  }

  addSourceHistory(forWhat: string, url: string): void {
    if (url === null || url === undefined) {
      return;
    }
    if (this.items[forWhat]?.history === undefined) {
      this.items[forWhat] = {
        history: [],
      };
    }
    if (!this.items[forWhat]?.history?.includes(url)) {
      this.items[forWhat].history.push(url);
      this.cookieService.set(
        `last${forWhat}Sources`,
        JSON.stringify(this.items[forWhat].history),
      );
    }
  }
}
