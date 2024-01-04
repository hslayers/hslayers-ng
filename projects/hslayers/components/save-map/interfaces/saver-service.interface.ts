import {CompoData} from 'hslayers-ng/common/types';
import {HsEndpoint} from 'hslayers-ng/shared/endpoints';
import {MapComposition} from 'hslayers-ng/common/types';

export interface HsSaverService {
  save(
    compositionJson: MapComposition,
    endpoint: HsEndpoint,
    compoData: CompoData,
    saveAsNew: boolean,
  ): Promise<any>;
}
