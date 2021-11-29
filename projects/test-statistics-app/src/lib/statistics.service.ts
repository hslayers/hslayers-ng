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

export interface ShiftBy {
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
      /** Used to later filter records by location/time since key string is hard to
       * use if only location is provided and not time or vice versa */
      const keyObject = {location: undefined, time: undefined};
      for (const col of columns
        .sort()
        .filter((col) => ['location', 'time'].includes(uses[col]))) {
        keyObject[uses[col]] = row[col];
      }
      let corpusItem: {values: CorpusItemValues};
      const key = keyObject.location + '::' + keyObject.time;
      if (this.corpus.dict[key] === undefined) {
        corpusItem = {values: {}, ...keyObject};
        this.corpus.dict[key] = corpusItem;
      } else {
        corpusItem = this.corpus.dict[key];
      }
      for (const col of columns.filter((col) => uses[col] == 'variable')) {
        //Why is this here? It breaks key comparisons between columns and usages
        //Answer: Its needed because vega treats everything after dot as a hierarchical sub-variable
        const escapedCol = col.replace(/\./g, '');
        corpusItem.values[escapedCol] = parseFloat(row[col]);
        if (!this.corpus.variables.some((v) => v == escapedCol)) {
          this.corpus.variables.push(escapedCol);
        }
        if (escapedCol != col) {
          uses[escapedCol] = uses[col];
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

  correlate(variableShifts: ShiftBy): {
    matrix: {
      [var1: string]: number[];
    };
    list: {
      var1: string;
      var2: string;
      coefficient: number;
    }[];
  } {
    const results = {matrix: {}, list: []};
    for (const var1 of this.corpus.variables) {
      results.matrix[var1] = [];
      for (const var2 of this.corpus.variables) {
        const dict = this.corpus.dict;
        const keys1 = Object.keys(dict).map((key) =>
          this.adjustDictionaryKey(key, var1, variableShifts)
        );
        const keys2 = Object.keys(dict).map((key) =>
          this.adjustDictionaryKey(key, var2, variableShifts)
        );
        const tmpSample1: number[] = keys1.map((key) =>
          dict[key] ? dict[key].values[var1] : undefined
        );
        const tmpSample2: number[] = keys2.map((key) =>
          dict[key] ? dict[key].values[var2] : undefined
        );
        const sample1 = [],
          sample2 = [];
        for (let i = 0; i < tmpSample1.length; i++) {
          if (
            tmpSample1[i] &&
            tmpSample2[i] &&
            !isNaN(tmpSample1[i]) &&
            !isNaN(tmpSample2[i])
          ) {
            sample1.push(tmpSample1[i]);
            sample2.push(tmpSample2[i]);
          }
        }
        const coefficient =
          sample1.length > 1 ? sampleCorrelation(sample1, sample2) : 0;
        results.matrix[var1].push(coefficient);
        if (var1 !== var2) {
          results.list.push({
            shift: variableShifts[var1] ?? 0,
            samplePairs: sample1.length,
            var1,
            var2,
            coefficient,
          });
        }
      }
    }
    return results;
  }

  /**
   * Take data dictionary item key and return the same item, but from another year
   * @param key
   * @param variable
   * @returns
   */
  private adjustDictionaryKey(
    key: string,
    variable: string,
    variableShifts: ShiftBy
  ): string {
    const origEntry = this.corpus.dict[key];
    return (
      origEntry.location +
      '::' +
      this.shiftTime(variable, origEntry.time, variableShifts)
    );
  }

  /**
   * Lookup time shifting amount
   * @param variable
   * @param time
   * @returns
   */
  shiftTime(variable: string, time: string, variableShifts: ShiftBy) {
    return parseInt(time) - (variableShifts[variable] ?? 0);
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
