import {inject, Injectable} from '@angular/core';

import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {Layer} from 'ol/layer';
import {WMTS} from 'ol/source';
import {get as getProjection, transform} from 'ol/proj';

import {HsMapService} from 'hslayers-ng/services/map';
import {getInfoFormat} from 'hslayers-ng/common/extensions';
import {paramsToURLWoEncode} from 'hslayers-ng/services/utils';

@Injectable({
  providedIn: 'root',
})
export class HsQueryWmtsService {
  hsMapService = inject(HsMapService);

  /**
   * Parse request URL
   * @param layer - Layer to Query
   * @param coordinate - Clicked coordinates
   * @returns Request URL and format
   */
  async parseRequestURL(
    layer: Layer<WMTS>,
    coordinate: number[],
  ): Promise<{url: string; format: string}> {
    const source = layer.getSource();

    if (getProjection(source.getProjection())) {
      coordinate = transform(
        coordinate,
        this.hsMapService.getCurrentProj(),
        source.getProjection(),
      );
    }

    const tileGrid = source.getTileGrid() as WMTSTileGrid;
    const tileCoord = tileGrid.getTileCoordForCoordAndResolution(
      coordinate,
      this.hsMapService.getMap().getView().getResolution(),
    );

    const tileExtent = tileGrid.getTileCoordExtent(tileCoord);

    const tileResolution = tileGrid.getResolution(tileCoord[0]);
    const tileMatrix = tileGrid.getMatrixIds()[tileCoord[0]];

    // I.J params (clicked pixel position relative to tile)
    const x = Math.floor(
      (coordinate[0] - tileExtent[0]) / (tileResolution / 1),
    ); //pixelRatio
    const y = Math.floor(
      (tileExtent[3] - coordinate[1]) / (tileResolution / 1),
    ); //pixelRatio

    const urls = source.getUrls()[0];

    const params = {
      LAYER: source.getLayer(),
      service: 'WMTS',
      INFOFORMAT: getInfoFormat(layer),
      REQUEST: 'GetFeatureInfo',
      TileCol: tileCoord[1],
      TileRow: tileCoord[2],
      I: x,
      J: y,
      TILEMATRIXSET: source.getMatrixSet(),
      TileMatrix: tileMatrix,
      feature_count: source.getLayer().length,
    };

    const url = [urls, paramsToURLWoEncode(params)].join('');
    return {
      url: url,
      format: params.INFOFORMAT,
    };
  }
}
