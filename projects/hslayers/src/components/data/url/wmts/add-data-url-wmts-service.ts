import BaseLayer from 'ol/layer/Base';
import {Attribution} from 'ol/control';
import {Group, Image as ImageLayer, Tile} from 'ol/layer';
import {ImageWMS, TileWMS} from 'ol/source';
import {Injectable} from '@angular/core';
import {WMSCapabilities} from 'ol/format';
import {transformExtent} from 'ol/proj';

import {HsAddDataService} from '../../add-data.service';
import {HsConfig} from '../../../../config.service';
import {HsDimensionService} from '../../../../common/dimension.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmsGetCapabilitiesService} from '../../../../common/wms/get-capabilities.service';
import {Subject} from 'rxjs';
import {addAnchors} from '../../../../common/attribution-utils';
import {getPreferedFormat} from '../../../../common/format-utils';

@Injectable({providedIn: 'root'})
export class HsAddDataUrlWmtsService {
  getDimensionValues;
  data;
  getWmsCapabilitiesError: Subject<any> = new Subject();
  constructor(
    public hsMapService: HsMapService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsDimensionService: HsDimensionService,
    public hsLayoutService: HsLayoutService,
    public hsLog: HsLogService,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public HsAddDataService: HsAddDataService
  ) {}
}
