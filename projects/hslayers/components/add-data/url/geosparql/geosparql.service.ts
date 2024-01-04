import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {lastValueFrom, takeUntil} from 'rxjs';

import {HsAddDataService} from '../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLogService} from 'hslayers-ng/shared/log';
import {UrlDataObject} from '../types/data-object.type';

@Injectable({providedIn: 'root'})
export class HsUrlGeoSparqlService {
  data: UrlDataObject;

  constructor(
    public httpClient: HttpClient,
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsLog: HsLogService,
    public hsAddDataUrlService: HsAddDataUrlService,
  ) {
    this.data = {
      table: {
        trackBy: 'id',
        nameProperty: 'name',
      },
    };
  }

  async verifyEndpoint(url: string) {
    try {
      const r = await lastValueFrom(
        this.httpClient
          .get(url, {
            //TODO: could there be also different accept header?
            headers: {'Accept': ['application/rdf+xml', 'application/xml']},
            responseType: 'blob',
          })
          .pipe(takeUntil(this.hsAddDataService.cancelUrlRequest)),
      );
      const blobText = await r.text();
      const parsedResponse = new DOMParser().parseFromString(
        blobText,
        'application/xml',
      );
      if (parsedResponse?.activeElement?.localName?.toLowerCase() === 'rdf') {
        return true;
      }
    } catch (e) {
      this.hsLog.warn(e);
      this.hsAddDataUrlService.addDataCapsParsingError.next(
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS.GEOSPARQL',
          'invalidEndpoint',
          null,
        ),
      );
    }
    return false;
  }

  /**
   * Searches for variables (words beginning on question mark) in the query string and returns an array of the variables found.
   * The regex pattern for allowed variable characters is created based on:
   * https://www.w3.org/TR/sparql11-query/#rVARNAME
   */
  findParamsInQuery(query: string): string[] {
    const regex =
      /\?[0-9A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u10000-\uEFFFF]+/g;
    return [...new Set(query.match(regex))].map((item) => item.slice(1));
  }
}
