import {CompoData} from '../types/compo-data.type';
import {HsEndpoint} from 'hslayers-ng/shared/endpoints';
import {MapComposition} from '../types/map-composition.type';

export interface HsSaverService {
  save(
    compositionJson: MapComposition,
    endpoint: HsEndpoint,
    compoData: CompoData,
    saveAsNew: boolean,
  ): Promise<any>;
}
