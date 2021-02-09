import VectorSource from 'ol/source/Vector';
import {HsVectorLayerOptions} from './vector-layer-options.type';

export class VectorLayerDescriptor {
  mapProjection;
  layerParams: {
    abstract: any;
    definition: any;
    name: any;
    title: any;
    opacity: any;
    fromComposition: boolean;
    style: any;
    source?: VectorSource;
    removable?: boolean;
    path: string;
    visible: boolean;
  };

  constructor(
    type: string,
    name,
    title,
    abstract,
    url: string,
    options: HsVectorLayerOptions,
    mapProjection
  ) {
    /**
     * Artificial object which is used when layer is saved to composition.
     * It describes format (ol.format.KML, )
     */
    const definition: {format?: string; url?: string} = {};

    this.mapProjection = mapProjection;

    this.layerParams = {
      abstract,
      definition,
      name,
      title,
      opacity: options.opacity || 1,
      fromComposition: options.fromComposition || false,
      style: options.style,
      removable: true,
      path: options.path,
      visible: options.visible,
    };

    switch (type ? type.toLowerCase() : '') {
      case 'kml':
        definition.format = 'ol.format.KML';
        definition.url = url;
        break;
      case 'geojson':
        definition.format = 'ol.format.GeoJSON';
        definition.url = url;
        break;
      case 'gpx':
        definition.format = 'ol.format.GPX';
        definition.url = url;
        break;
      case 'sparql':
        definition.format = 'hs.format.Sparql';
        break;
      case 'wfs':
        Object.assign(this.layerParams, {
          editor: {
            editable: true,
            defaultAttributes: {
              name: title,
            },
          },
        });
        break;
      default:
    }
  }
}
