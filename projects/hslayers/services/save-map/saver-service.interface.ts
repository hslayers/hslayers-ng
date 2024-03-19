import {CompoData} from 'hslayers-ng/types';
import {HsEndpoint} from 'hslayers-ng/types';
import {MapComposition} from 'hslayers-ng/types';

export interface HsSaverService {
  save(
    compositionJson: MapComposition,
    endpoint: HsEndpoint,
    compoData: CompoData,
    saveAsNew: boolean,
  ): Promise<any>;
}
