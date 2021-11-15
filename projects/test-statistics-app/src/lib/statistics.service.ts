import {Injectable} from '@angular/core';

import {sampleCorrelation, sampleVariance} from 'simple-statistics';

export interface Usage {
  [key: string]: 'location' | 'ignore' | 'time' | 'variable';
}

export interface CorpusItemValues {
  [key: string]: number;
}

export interface CorpusItems {
  dict: {[key: string]: {values: CorpusItemValues}};
  variables: string[];
  uses: Usage;
}

@Injectable({
  providedIn: 'root',
})
export class HsStatisticsService {
  /** Main hash table of time+location keys and values which are populated from columns marked as 'variable'*/
  corpus: CorpusItems = {dict: {}, variables: [], uses: {}};
  constructor() {
    const savedCorpus = localStorage.getItem('hs_statistics_corpus');
    if (savedCorpus) {
      this.corpus = JSON.parse(savedCorpus);
    }
  }

  store(rows: any[], columns: string[], uses: Usage): void {
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
        corpusItem.values[col] = parseFloat(row[col]);
        if (!this.corpus.variables.some((v) => v == col)) {
          this.corpus.variables.push(col);
        }
      }
    }
    Object.assign(this.corpus.uses, uses);
    localStorage.setItem('hs_statistics_corpus', JSON.stringify(this.corpus));
  }

  correlate(): {
    var1: string;
    var2: string;
    coefficient: number;
  }[] {
    const results = [];
    for (const var1 of this.corpus.variables) {
      for (const var2 of this.corpus.variables.filter((v) => v != var1)) {
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
        results.push({
          var1,
          var2,
          coefficient: sampleCorrelation(sample1, sample2),
        });
      }
    }
    return results;
  }
}
