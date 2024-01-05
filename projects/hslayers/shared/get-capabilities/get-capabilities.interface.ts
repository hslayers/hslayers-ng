import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {CapabilitiesResponseWrapper} from 'hslayers-ng/common/types';

export interface IGetCapabilities {
  getPathFromUrl(str: string): string;
  params2String(obj): string;
  request(
    service_url: string,
    owrCache?: boolean,
  ): Promise<CapabilitiesResponseWrapper>;
  service2layers?(caps: any, path?: string): Layer<Source>[];
}
