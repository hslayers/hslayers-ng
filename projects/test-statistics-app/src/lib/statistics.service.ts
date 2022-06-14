import {Injectable} from '@angular/core';

import {ColumnWrapper} from './column-wrapper.type';
import {
  HsConfirmDialogComponent,
  HsDialogContainerService,
  HsLanguageService,
} from 'hslayers-ng';
import {Subject} from 'rxjs';
import {sampleCorrelation} from 'simple-statistics';

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

class StatisticsServiceParams {
  /** Main hash table of time+location keys and values which are populated from columns marked as 'variable'*/
  corpus: CorpusItems = {dict: {}, variables: [], uses: {}};
  clearData$: Subject<void> = new Subject();
  activeTab = 1;
  predictions: any = [];
}

@Injectable({
  providedIn: 'root',
})
export class HsStatisticsService {
  apps: {
    [id: string]: StatisticsServiceParams;
  } = {default: new StatisticsServiceParams()};
  constructor(
    public hsLanguageService: HsLanguageService,
    public hsDialogContainerService: HsDialogContainerService
  ) {}

  /**
   * Initialize the map swipe service data and subscribers
   * @param app - App identifier
   */
  init(app: string) {
    const savedCorpus = localStorage.getItem('hs_statistics_corpus');
    if (savedCorpus) {
      this.get(app).corpus = JSON.parse(savedCorpus);
    }
    const savedPredictions = localStorage.getItem('hs_statistics_predictions');
    if (savedPredictions) {
      this.get(app).predictions = JSON.parse(savedPredictions);
    }
  }
  /**
   * Get the params saved by the statistics service for the current app
   * @param app - App identifier
   */
  get(app: string): StatisticsServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new StatisticsServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  clone(observations) {
    return observations.map((o) => {
      const tmp = {};
      Object.assign(tmp, o);
      return tmp;
    });
  }

  store(rows: any[], columns: string[], uses: Usage, app: string): void {
    const appRef = this.get(app);
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
      if (appRef.corpus.dict[key] === undefined) {
        corpusItem = {values: {}, ...keyObject};
        appRef.corpus.dict[key] = corpusItem;
      } else {
        corpusItem = appRef.corpus.dict[key];
      }
      for (const col of columns.filter((col) => uses[col] == 'variable')) {
        //Why is this here? It breaks key comparisons between columns and usages
        //Answer: Its needed because vega treats everything after dot as a hierarchical sub-variable
        const escapedCol = col.replace(/\./g, '');
        corpusItem.values[escapedCol] = parseFloat(row[col]);
        if (!appRef.corpus.variables.some((v) => v == escapedCol)) {
          appRef.corpus.variables.push(escapedCol);
        }
        if (escapedCol != col) {
          uses[escapedCol] = uses[col];
        }
      }
    }
    Object.assign(appRef.corpus.uses, uses);
    localStorage.setItem('hs_statistics_corpus', JSON.stringify(appRef.corpus));
    localStorage.setItem(
      'hs_statistics_table',
      JSON.stringify({rows: rows, columns: columns})
    );
  }

  addPrediction(
    app: string,
    name: string,
    type: 'linear' | 'multi-linear',
    coefficients: any,
    predictedVariable: string,
    variables: ColumnWrapper[]
  ) {
    const appRef = this.get(app);
    appRef.predictions.push({
      name,
      type,
      predictedVariable,
      coefficients,
      variables,
    });
    localStorage.setItem(
      'hs_statistics_predictions',
      JSON.stringify(appRef.predictions)
    );
  }

  correlate(
    variableShifts: ShiftBy,
    app: string
  ): {
    matrix: {
      [var1: string]: number[];
    };
    list: {
      var1: string;
      var2: string;
      coefficient: number;
    }[];
  } {
    const appRef = this.get(app);
    const results = {matrix: {}, list: []};
    for (const var1 of appRef.corpus.variables) {
      results.matrix[var1] = [];
      for (const var2 of appRef.corpus.variables) {
        const {samples} = this.createShiftedSamples(
          [var1, var2],
          variableShifts,
          app
        );
        const coefficient =
          samples[0].length > 1 ? sampleCorrelation(samples[0], samples[1]) : 0;
        results.matrix[var1].push(coefficient);
        if (var1 !== var2) {
          results.list.push({
            shift: variableShifts[var1] ?? 0,
            samplePairs: samples[0].length,
            var1,
            var2,
            coefficient,
          });
        }
      }
    }
    return results;
  }

  createShiftedSamples(
    variables: string[],
    variableShifts: ShiftBy,
    app: string
  ): {samples: number[][]; sampleKeys: string[][]} {
    const dict = this.get(app).corpus.dict;
    const tmpSamples = variables.map((variable) => {
      const keys = Object.keys(dict).map((key) =>
        this.adjustDictionaryKey(
          this.get(app).corpus.dict,
          key,
          variable,
          variableShifts
        )
      );
      return {
        values: keys.map((key) =>
          dict[key] ? dict[key].values[variable] : undefined
        ),
        keys,
      };
    });

    const samples = variables.map((_) => []);
    const sampleKeys = variables.map((_) => []);
    for (let i = 0; i < tmpSamples[0].values.length; i++) {
      if (
        tmpSamples.some(
          (sample) =>
            sample.values[i] === null ||
            sample.values[i] === undefined ||
            isNaN[sample.values[i]]
        )
      ) {
        continue;
      } else {
        for (let varIx = 0; varIx < variables.length; varIx++) {
          samples[varIx].push(tmpSamples[varIx].values[i]);
          sampleKeys[varIx].push(tmpSamples[varIx].keys[i]);
        }
      }
    }
    return {samples, sampleKeys};
  }

  /**
   * Take data dictionary item key and return the same item, but from another year
   * @param key -
   * @param variable -
   * @param variableShifts -
   * @param app - App identifier
   * @returns
   */
  adjustDictionaryKey(
    dict: {
      [key: string]: {
        values: CorpusItemValues;
        location?: string;
        time?: string;
      };
    },
    key: string,
    variable: string,
    variableShifts: ShiftBy
  ): string {
    const origEntry = dict[key];
    return (
      origEntry.location +
      '::' +
      this.shiftTime(variable, origEntry.time, variableShifts)
    );
  }

  /**
   * Lookup time shifting amount
   * @param variable -
   * @param time -
   * @returns
   */
  shiftTime(variable: string, time: string, variableShifts: ShiftBy) {
    return parseInt(time) + (variableShifts[variable] ?? 0);
  }

  async clear(app: string): Promise<void> {
    const appRef = this.get(app);
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.hsLanguageService.getTranslation(
          'STATISTICS.CLEAR_ALL_STATISTICS_DATA'
        ),
        title: this.hsLanguageService.getTranslation('COMMON.confirm'),
      },
      app
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      appRef.corpus.dict = {};
      appRef.corpus.variables = [];
      appRef.corpus.uses = {};
      localStorage.removeItem('hs_statistics_corpus');
      localStorage.removeItem('hs_statistics_table');
      appRef.clearData$.next();
    }
  }
}
