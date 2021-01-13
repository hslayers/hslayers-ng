import {Injectable} from '@angular/core';
import {transform} from 'ol/proj';

import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsQueryWmtsService {
  constructor(
    private HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService,
  ) {}

  async parseRequestUrl(layer, coordinate) {
    const source = layer.getSource();

    coordinate = transform(
      coordinate,
      this.HsMapService.getCurrentProj(),
      source.getProjection()
    );

    const tileGrid = source.getTileGrid();
    const tileCoord = tileGrid.getTileCoordForCoordAndResolution(
      coordinate,
      this.HsMapService.map.getView().getResolution()
    );

    const tileExtent = tileGrid.getTileCoordExtent(tileCoord);

    const tileResolution = tileGrid.getResolution(tileCoord[0]);
    const tileMatrix = tileGrid.getMatrixIds()[tileCoord[0]];

    // I.J params (clicked pixel position relative to tile)
    const x = Math.floor(
      (coordinate[0] - tileExtent[0]) / (tileResolution / 1)
    ); //pixelRatio
    const y = Math.floor(
      (tileExtent[3] - coordinate[1]) / (tileResolution / 1)
    ); //pixelRatio

    const urls = source.getUrls()[0];

    const params = {
      LAYER: source.getLayer(),
      service: 'WMTS',
      INFOFORMAT: layer.get('info_format'),
      REQUEST: 'GetFeatureInfo',
      TileCol: tileCoord[1],
      TileRow: tileCoord[2],
      I: x,
      J: y,
      TILEMATRIXSET: source.getMatrixSet(),
      TileMatrix: tileMatrix,
    };

    const url = [urls, this.HsUtilsService.paramsToURLWoEncode(params)].join(
      ''
    );
    return {
      url: url,
      format: params.INFOFORMAT,
    };
  }
}
