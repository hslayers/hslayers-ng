import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {lastValueFrom, takeUntil} from 'rxjs';

import {HsAddDataService} from '../../add-data.service';
import {urlDataObject} from '../types/data-object.type';

class HsUrlGeoSparqlParams {
  data: urlDataObject;

  constructor() {
    this.data = {
      table: {
        trackBy: 'id',
        nameProperty: 'name',
      },
    };
  }
}

@Injectable({providedIn: 'root'})
export class HsUrlGeoSparqlService {
  apps: {
    [id: string]: any;
  } = {default: new HsUrlGeoSparqlParams()};

  constructor(
    public httpClient: HttpClient,
    public hsAddDataService: HsAddDataService
  ) {}

  get(app: string): HsUrlGeoSparqlParams {
    if (this.apps[app ?? 'default'] === undefined) {
      this.apps[app ?? 'default'] = new HsUrlGeoSparqlParams();
    }
    return this.apps[app ?? 'default'];
  }

  async verifyEndpoint(url: string, app: string = 'default') {
    try {
      const r = await lastValueFrom(
        this.httpClient
          .get(url, {
            //TODO: could there be also different accept header?
            headers: {'Accept': ['application/rdf+xml', 'application/xml']},
            responseType: 'blob',
          })
          .pipe(takeUntil(this.hsAddDataService.cancelUrlRequest))
      );
      const blobText = await r.text();
      const parsedResponse = new DOMParser().parseFromString(
        blobText,
        'application/xml'
      );
      console.log(parsedResponse);
      console.log(parsedResponse.activeElement.localName);
      if (parsedResponse.activeElement.localName === 'RDF') {
        return true;
      }
    } catch {
      TODO: null;
    }
    return false;
  }
}
