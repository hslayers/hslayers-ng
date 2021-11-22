import {Injectable} from '@angular/core';

import {
  HsConfirmDialogComponent,
  HsDialogContainerService,
  HsLanguageService,
} from 'hslayers-ng';
import {Subject} from 'rxjs';
import {sampleCorrelation, sampleVariance} from 'simple-statistics';

export interface Usage {
  [key: string]: 'location' | 'ignore' | 'time' | 'variable';
}

export interface CorpusItemValues {
  [key: string]: number;
}

export interface CorpusItems {
  dict: {
    [key: string]: {values: CorpusItemValues; location?: string; time?: string};
  };
  variables: string[];
  uses: Usage;
}

@Injectable({
  providedIn: 'root',
})
export class HsStatisticsService {
  /** Main hash table of time+location keys and values which are populated from columns marked as 'variable'*/
  corpus: CorpusItems = {dict: {}, variables: [], uses: {}};
  clearData$: Subject<void> = new Subject();
  constructor(
    public hsLanguageService: HsLanguageService,
    public hsDialogContainerService: HsDialogContainerService
  ) {
    const savedCorpus = localStorage.getItem('hs_statistics_corpus');
    if (savedCorpus) {
      this.corpus = JSON.parse(savedCorpus);
    }
  }

  store(rows: any[], columns: string[], uses: Usage): void {
    if (!rows || !columns) {
      return;
    }
    for (const row of rows) {
      /** Example '2010Kentucky' */
      let key = '';
      /** Used to later filter records by location/time since key string is hard to
       * use if only location is provided and not time or vice versa */
      const keyObject = {location: undefined, time: undefined};
      for (const col of columns
        .sort()
        .filter((col) => ['location', 'time'].includes(uses[col]))) {
        key += row[col];
        keyObject[uses[col]] = row[col];
      }
      let corpusItem: {values: CorpusItemValues};
      if (this.corpus.dict[key] === undefined) {
        corpusItem = {values: {}, ...keyObject};
        this.corpus.dict[key] = corpusItem;
      } else {
        corpusItem = this.corpus.dict[key];
      }
      for (const col of columns.filter((col) => uses[col] == 'variable')) {
        const escapedCol = col.replace(/\./g, '');
        corpusItem.values[escapedCol] = parseFloat(row[col]);
        if (!this.corpus.variables.some((v) => v == escapedCol)) {
          this.corpus.variables.push(escapedCol);
        }
      }
    }
    Object.assign(this.corpus.uses, uses);
    localStorage.setItem('hs_statistics_corpus', JSON.stringify(this.corpus));
    localStorage.setItem(
      'hs_statistics_table',
      JSON.stringify({rows: rows, columns: columns})
    );
  }

  correlate(): {
    [var1: string]: {
      coeficients: number[];
    };
  } {
    const results = {};
    for (const var1 of this.corpus.variables) {
      results[var1] = [];
      for (const var2 of this.corpus.variables) {
        const keys = Object.keys(this.corpus.dict).filter(
          (key) =>
            !isNaN(this.corpus.dict[key].values[var1]) &&
            !isNaN(this.corpus.dict[key].values[var2])
        );
        const sample1: number[] = keys.map(
          (key) => this.corpus.dict[key].values[var1]
        );
        const sample2: number[] = keys.map(
          (key) => this.corpus.dict[key].values[var2]
        );
        const corr = sampleCorrelation(sample1, sample2);
        results[var1].push(
          Number(corr.toFixed(4)) > 0.9999
            ? Math.round(corr)
            : Number(corr.toFixed(4))
        );
      }
    }
    return results;
  }

  async clear(): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.hsLanguageService.getTranslation(
          'STATISTICS.CLEAR_ALL_STATISTICS_DATA'
        ),
        title: this.hsLanguageService.getTranslation('COMMON.confirm'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.corpus.dict = {};
      this.corpus.variables = [];
      this.corpus.uses = {};
      localStorage.removeItem('hs_statistics_corpus');
      localStorage.removeItem('hs_statistics_table');
      this.clearData$.next();
    }
  }
}
