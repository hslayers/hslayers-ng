import {CookieService} from 'ngx-cookie-service';
import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class HsHistoryListService {
  items: any = {};

  constructor(private CookieService: CookieService) {}
  readSourceHistory(forWhat: string): Array<string> {
    if (forWhat !== undefined) {
      const sourceString = this.CookieService.get(`last${forWhat}Sources`);
      if (sourceString !== undefined) {
        this.items[forWhat] = {
          history: [],
        };
        this.items[forWhat].history.push(sourceString);
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
    if (this.items[forWhat].history === undefined) {
      this.items[forWhat] = {
        history: [],
      };
    }
    if (this.items[forWhat].history.indexOf(url) == -1) {
      this.items[forWhat].history.push(url);
      this.CookieService.set(
        `last${forWhat}Sources`,
        this.items[forWhat].history
      );
    }
  }
}
