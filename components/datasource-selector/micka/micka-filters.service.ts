import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsUtilsService} from '../../utils/utils.service';

@Injectable({providedIn: 'root'})
export class HsMickaFilterService {
  suggestionConfig = {
    input: '',
    param: '',
    field: '',
  };
  suggestions = [];
  suggestionFilter;
  suggestionsLoaded = true;
  filterByExtent = true;
  otnKeywords = [];

  /**
   * @param $http
   * @param $q
   * @param HsUtilsService
   * @param HsCommonEndpointsService
   */
  constructor(
    private http: HttpClient,
    private hsUtilsService: HsUtilsService,
    private hsCommonEndpointsService: HsCommonEndpointsService
  ) {
    if (
      this.hsCommonEndpointsService.endpoints &&
      this.hsCommonEndpointsService.endpoints.filter(
        (ds) => ds.url.indexOf('opentnet.eu') > -1
      ).length > 0
    ) {
      this.http
        .get(
          this.hsUtilsService.proxify(
            'http://opentransportnet.eu:8082/api/3/action/vocabulary_show?id=36c07014-c461-4f19-b4dc-a38106144e66'
          ),
          {
            responseType: 'json',
          }
        )
        .toPromise()
        .then((response: any) => {
          this.otnKeywords = [{title: '-'}];
          response.data.result.tags.forEach((tag) => {
            this.otnKeywords.push({title: tag.name});
          });
        });
    }
  }

  /**
   * @function fillCodesets
   * @memberof HsDatasourceBrowserService
   * @param {object} datasets Input datasources
   * Download codelists for all "micka" type datasources from Url specified in app config.
   */
  fillCodesets() {
    this.hsCommonEndpointsService.endpoints
      .filter((ep) => ep.type == 'micka')
      .forEach((ep) => this.fillCodeset(ep));
  }

  /**
   * @function fillCodeset
   * @memberof HsDatasourceBrowserService
   * @param {object} ds Single datasource
   * Download code-list for micka type source from Url specifiead in app config.
   */
  fillCodeset(ds) {
    if (ds.type == 'micka') {
      let url = ds.code_list_url;
      if (url === undefined) {
        return;
      }
      url = this.hsUtilsService.proxify(url);
      if (ds.code_lists === undefined) {
        ds.code_lists = {
          serviceType: [],
          applicationType: [],
          dataType: [],
          topicCategory: [],
        };
      }
      /*if (ds.canceler !== undefined) {
        ds.canceler.resolve();
        delete ds.canceler;
      }*/
      //ds.canceler = $q.defer();
      this.http
        .get(url, {
          responseType: 'json',
          //timeout: ds.canceler.promise
        })
        .toPromise()
        .then(
          (j: any) => {
            const oParser = new DOMParser();
            const oDOM = oParser.parseFromString(j.data, 'application/xml');
            const doc = oDOM.documentElement;
            doc
              .querySelectorAll('map serviceType value')
              .forEach((type: any) => {
                ds.code_lists.serviceType.push({
                  value: type.attributes.name.value,
                  name: type.innerHTML,
                });
              });
            doc
              .querySelectorAll('map applicationType value')
              .forEach((type: any) => {
                ds.code_lists.applicationType.push({
                  value: type.attributes.name.value,
                  name: type.innerHTML,
                });
              });
            doc
              .querySelectorAll('map topicCategory value')
              .forEach((type: any) => {
                ds.code_lists.topicCategory.push({
                  value: type.attributes.name.value,
                  name: type.innerHTML,
                });
              });
            this.advancedMickaTypeChanged(ds, 'service');
          },
          (err) => {}
        );
    }
  }

  /**
   * @function advancedMickaTypeChanged
   * @memberof HsDatasourceBrowserService
   * @param {object} mickaDS Micka dataset definition
   * @param {string} type Micka query type
   * Sets Micka source level types according to current query type (service/appilication). Deprecated?
   */
  advancedMickaTypeChanged(mickaDS, type) {
    if (mickaDS.code_lists === undefined) {
      return;
    }
    switch (type) {
      default:
      case 'service':
        mickaDS.level2_types = mickaDS.code_lists.serviceType;
        break;
      case 'application':
        mickaDS.level2_types = mickaDS.code_lists.applicationType;
        break;
    }
  }

  changeSuggestionConfig(input: string, param: string, field: string): void {
    this.suggestionConfig = {
      input: input,
      param: param,
      field: field,
    };
  }

  /**
   * @function suggestionFilterChanged
   * @memberof HsDatasourceBrowserService
   * @param {object} mickaDS Micka catalogue config passed here from directive
   * Send suggestion request to Micka CSW server and parse response
   */
  suggestionFilterChanged(mickaDS) {
    let url =
      mickaDS.url +
      '../util/suggest.php?' +
      this.hsUtilsService.paramsToURL({
        type: this.suggestionConfig.param,
        query: this.suggestionFilter,
      });
    url = this.hsUtilsService.proxify(url);
    this.suggestionsLoaded = false;
    this.suggestions = [];
    this.http
      .get(url, {responseType: 'json'})
      .toPromise()
      .then((response: any) => {
        const j = response.data;
        this.suggestionsLoaded = true;
        this.suggestions = j.records;
      });
  }
}
