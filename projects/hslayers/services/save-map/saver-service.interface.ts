import {CompoData, HsEndpoint, MapComposition} from 'hslayers-ng/types';

export interface HsSaverService {
  save(
    compositionJson: MapComposition,
    endpoint: HsEndpoint,
    compoData: CompoData,
    saveAsNew: boolean,
  ): Promise<any>;
}
