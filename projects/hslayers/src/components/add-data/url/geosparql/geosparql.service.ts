import {Injectable} from '@angular/core';
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

  constructor() {}

  get(app: string): HsUrlGeoSparqlParams {
    if (this.apps[app ?? 'default'] === undefined) {
      this.apps[app ?? 'default'] = new HsUrlGeoSparqlParams();
    }
    return this.apps[app ?? 'default'];
  }
}
