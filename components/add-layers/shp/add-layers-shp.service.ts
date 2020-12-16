import {FileDescriptor} from './file-descriptor.type';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLogService} from '../../../common/log/log.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class HsAddLayersShpService {
  constructor(private httpClient: HttpClient, public hsLog: HsLogService) {}

  /**
   * @function add
   * @description Load nonwms OWS data and create layer
   * @param {object} endpoint Layman endpoint description (url, name, user)
   * @param {Array} files Array of shp files (shp, dbf, shx)
   * @param {string} name Name of new layer
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param {string} srs EPSG code of selected projection (eg. "EPSG:4326")
   * @param {Array} sld Array of sld files
   * @returns {Promise}
   */
  add(
    endpoint: HsEndpoint,
    files: FileDescriptor[],
    name: string,
    title: string,
    abstract: string,
    srs: string,
    sld: FileDescriptor
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const formdata = new FormData();
      files.forEach((file) => {
        formdata.append(
          'file',
          new Blob([file.content], {type: file.type}),
          file.name
        );
      });
      if (sld) {
        formdata.append(
          'sld',
          new Blob([sld.content], {type: sld.type}),
          sld.name
        );
      }
      formdata.append('name', name);
      formdata.append('title', title);
      formdata.append('abstract', abstract);
      formdata.append('crs', srs);
      this.httpClient
        .post(
          `${endpoint.url}/rest/${endpoint.user}/layers?${Math.random()}`,
          formdata //,
          //{headers: new HttpHeaders({'Content-Type': null})}
        )
        .toPromise()
        .then((data: any) => {
          if (data && data.length > 0) {
            resolve(data);
          } else {
            reject(data);
          }
        })
        .catch((err) => {
          this.hsLog.error(err);
          reject(err);
        });
    });
  }
}
