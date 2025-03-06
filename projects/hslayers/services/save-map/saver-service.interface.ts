import {CompoData, MapComposition} from 'hslayers-ng/types';

export interface HsSaverService {
  save(
    compositionJson: MapComposition,
    compoData: CompoData,
    saveAsNew: boolean,
  ): Promise<any>;
}
