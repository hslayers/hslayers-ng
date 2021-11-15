import {Injectable} from '@angular/core';

import {sampleCorrelation, sampleVariance} from 'simple-statistics';

export interface Usage {
  [key: string]: 'location' | 'ignore' | 'time' | 'variable';
}

export interface CorpusItemValues {
  [key: string]: number;
}

export interface CorpusItems {
  [key: string]: {values: CorpusItemValues};
}

@Injectable({
  providedIn: 'root',
})
export class HsStatisticsService {
  /** Main hash table of time+location keys and values which are populated from columns marked as 'variable'*/
  dataCorpus: CorpusItems = {};
  variables: string[] = [];
  constructor() {
    const savedCorpus = localStorage.getItem('hs_statistics_corpus');
    if (savedCorpus) {
      this.dataCorpus = JSON.parse(savedCorpus);
    }
    const savedVars = localStorage.getItem('hs_statistics_variables');
    if (savedCorpus) {
      this.variables = JSON.parse(savedVars);
    }
  }

  store(rows, columns, uses): void {
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
      if (this.dataCorpus[key] === undefined) {
        corpusItem = {values: {}, ...keyObject};
        this.dataCorpus[key] = corpusItem;
      } else {
        corpusItem = this.dataCorpus[key];
      }
      for (const col of columns.filter((col) => uses[col] == 'variable')) {
        corpusItem.values[col] = parseFloat(row[col]);
        if (!this.variables.some((v) => v == col)) {
          this.variables.push(col);
        }
      }
    }
    localStorage.setItem(
      'hs_statistics_corpus',
      JSON.stringify(this.dataCorpus)
    );
    localStorage.setItem(
      'hs_statistics_variables',
      JSON.stringify(this.variables)
    );
  }

  correlate(): {
    var1: string;
    var2: string;
    coefficient: number;
  }[] {
    const results = [];
    for (const var1 of this.variables) {
      for (const var2 of this.variables.filter((v) => v != var1)) {
        const keys = Object.keys(this.dataCorpus).filter(
          (key) =>
            !isNaN(this.dataCorpus[key].values[var1]) &&
            !isNaN(this.dataCorpus[key].values[var2])
        );
        const sample1: number[] = keys.map(
          (key) => this.dataCorpus[key].values[var1]
        );
        const sample2: number[] = keys.map(
          (key) => this.dataCorpus[key].values[var2]
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
