import {CompoData} from '../types/compo-data.type';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {MapComposition} from '../types/map-composition.type';

export interface HsSaverService {
  save(
    compositionJson: MapComposition,
    endpoint: HsEndpoint,
    compoData: CompoData,
    saveAsNew: boolean,
  ): Promise<any>;
}
