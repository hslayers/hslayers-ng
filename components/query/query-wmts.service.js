import {transform} from 'ol/proj';
/**

 * @param HsMapService
 * @param HsUtilsService
 * @param HsLayermanagerService
 */
export default function (
    HsMapService,
    HsUtilsService,
    HsLayermanagerService
) {
    'ngInject';
    const me = this;

    this.parseRequestUrl = async function (layer, coordinate) {
        const source = layer.getSource();
        
        coordinate = transform(coordinate,HsMapService.map.getView().getProjection(),source.getProjection()) 

        const tileGrid = source.getTileGrid();
        const tileCoord = tileGrid.getTileCoordForCoordAndResolution(
            coordinate, HsLayermanagerService.currentResolution);
        
        const tileExtent = tileGrid.getTileCoordExtent(tileCoord);

        const tileResolution = tileGrid.getResolution(tileCoord[0]);
        const tileMatrix = tileGrid.getMatrixIds()[tileCoord[0]];

        // I.J params (clicked pixel position relative to tile)
        const x = Math.floor((coordinate[0] - tileExtent[0]) /
            (tileResolution / 1)); //pixelRatio
        const y = Math.floor((tileExtent[3] - coordinate[1]) /
            (tileResolution / 1)); //pixelRatio
        
        const urls = source.getUrls()[0];

        let params = {
            LAYER: source.getLayer(),
            service: 'WMTS',
            INFOFORMAT: layer.get('info_format'),
            REQUEST: 'GetFeatureInfo',
            TileCol: tileCoord[1],
            TileRow: tileCoord[2],
            I:x, 
            J: y,
            TILEMATRIXSET: source.getMatrixSet(),
            TileMatrix: tileMatrix
        };

        let url = [
            urls,
            HsUtilsService.paramsToURLWoEncode(params),
        ].join('');
        return {
            url: url,
            format: params.INFOFORMAT
        }
    }
    
    return me;
}

