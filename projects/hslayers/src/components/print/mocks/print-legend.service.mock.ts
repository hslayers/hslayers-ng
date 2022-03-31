import {PrintLegendParams} from '../print-legend.service';

export class HsPrintLegendServiceMock {
  apps: {[id: string]: PrintLegendParams} = {
    default: new PrintLegendParams(),
  };
  constructor() {}

  get(): PrintLegendParams {
    return this.apps['default'];
  }

  init(app: string): void {
    return;
  }
}
