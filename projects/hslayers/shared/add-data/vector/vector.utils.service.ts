import {Injectable} from '@angular/core';

import {Projection, get as getProjection} from 'ol/proj';
import {PROJECTIONS as epsg4326Aliases} from 'ol/proj/epsg4326';

import {HsLaymanService} from 'hslayers-ng/shared/save-map';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataVectorUtilsService {
  constructor(private hsLaymanService: HsLaymanService) {}
  /**
   * Tries to guess file type based on the file extension
   * @param extension - Parsed file extension from uploaded file
   */
  tryGuessTypeFromNameOrUrl(extension: string): string {
    if (extension !== undefined) {
      if (extension.toLowerCase().endsWith('kml')) {
        return 'kml';
      }
      if (extension.toLowerCase().endsWith('gpx')) {
        return 'gpx';
      }
      if (
        extension.toLowerCase().endsWith('geojson') ||
        extension.toLowerCase().endsWith('json')
      ) {
        return 'geojson';
      }
    }
  }

  /**
   * Returns layman supported projection
   */
  getFeaturesProjection(projection: Projection): Projection {
    return epsg4326Aliases
      .map((proj) => proj.getCode())
      .some((code) => code === projection.getCode())
      ? getProjection('EPSG:4326')
      : this.hsLaymanService.supportedCRRList.indexOf(projection.getCode()) > -1
        ? projection
        : getProjection('EPSG:4326');
    //Features in map CRS
  }
}
