import Resumable from 'resumablejs';
import {FileDescriptor} from './file-descriptor.type';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {HsEndpoint} from '../../../../common/endpoints/endpoint.interface';
import {HsLaymanService} from '../../../save-map/layman.service';
import {HsLogService} from '../../../../common/log/log.service';

import {PREFER_RESUMABLE_SIZE_LIMIT} from '../../../save-map/layman-utils';
import {accessRightsInterface} from '../../common/access-rights.interface';

@Injectable({providedIn: 'root'})
export class HsAddDataFileShpService {
  asyncLoading;
  constructor(
    private httpClient: HttpClient,
    public hsLog: HsLogService,
    public HsLaymanService: HsLaymanService
  ) {}

  /**
   * @description Load non-wms OWS data and create layer
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
    sld: FileDescriptor,
    access_rights: accessRightsInterface
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

      const files_to_async_upload = [];
      const sumFileSize = formdata
        .getAll('file')
        .filter((f) => (f as File).name)
        .reduce((prev, f) => prev + (f as File).size, 0);
      this.asyncLoading = sumFileSize >= PREFER_RESUMABLE_SIZE_LIMIT;
      if (this.asyncLoading) {
        this.HsLaymanService.switchFormDataToFileNames(
          formdata,
          files_to_async_upload
        );
      }

      if (sld) {
        formdata.append(
          'sld',
          new Blob([sld.content], {type: sld.type}),
          sld.name
        );
      }
      formdata.append('name', name);
      title = title == '' ? name : title;
      formdata.append('title', title);
      formdata.append('abstract', abstract);
      formdata.append('crs', srs);

      const write =
        access_rights['access_rights.write'] == 'private'
          ? endpoint.user
          : access_rights['access_rights.write'];
      const read =
        access_rights['access_rights.read'] == 'private'
          ? endpoint.user
          : access_rights['access_rights.read'];

      formdata.append('access_rights.write', write);
      formdata.append('access_rights.read', read);
      this.httpClient
        .post(
          `${endpoint.url}/rest/workspaces/${
            endpoint.user
          }/layers?${Math.random()}`,
          formdata,
          {withCredentials: true}
        )
        .toPromise()
        .then(async (data: any) => {
          //CHECK IF OK not auth etc.
          if (data && data.length > 0) {  
            if (this.asyncLoading) {
              const promise = await this.HsLaymanService.asyncUpload(
                files_to_async_upload,
                data,
                endpoint
              );
              resolve(promise);
            } else {
              resolve(data);
            }
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
