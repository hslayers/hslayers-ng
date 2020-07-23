/* eslint-disable prefer-arrow-callback */
import './compositions.module';
import 'angular-mocks';
import * as angular from 'angular';
import Map from 'ol/Map';
import {Subject} from 'rxjs';

/* eslint-disable angular/no-service-method */
/* eslint-disable angular/di */
('use strict');

describe('compositions', function () {
  let scope;
  let $componentController;
  let $httpBackend;

  beforeEach(function () {
    angular.module('hs', []).value('HsConfig', {
      compositions_catalogue_url:
        'http://www.whatstheplan.eu/p4b-dev/cat/catalogue/libs/cswclient/cswClientRun.php',
      status_manager_url:
        'http://erra.ccss.cz/wwwlibs/statusmanager2/index.php',
    });

    angular
      .module('hs.core', [])
      .service('HsCore', function () {})
      .service('HsEventBusService', function () {
        this.sizeChanges = new Subject();
        this.mapResets = new Subject();
        this.compositionEdits = new Subject();
        this.compositionLoadStarts = new Subject();
        this.compositionDeletes = new Subject();
        this.mainPanelChanges = new Subject();
        this.mapExtentChanges = new Subject();
      });

    angular
      .module('hs.utils', [])
      .service('HsUtilsService', function () {
        this.debounce = function () {};
        this.proxify = function(url){return url}
      })
      .service('HsLayerUtilsService', function () {});

    angular.module('hs.layout', []).service('HsLayoutService', function () {});
    angular
      .module('hs.permalink', [])
      .service('HsPermalinkUrlService', function () {
        this.getParamValue = function () {
          return undefined;
        };
      });
    angular
      .module('hs.save-map', [])
      .service('HsStatusManagerService', function () {});
    angular
      .module('hs.common.layman', [])
      .service('HsCommonLaymanService', function () {});
    angular
      .module('hs.common.endpoints', [])
      .service('HsCommonEndpointsService', function () {
        this.endpoints = [];
      });

    angular.module('hs.map', []).service('HsMapService', function () {
      this.map = new Map({
        target: 'div',
        interactions: [],
      });
      this.loaded = () => {
        return new Promise((resolve, reject) => {
          resolve(this.map);
        });
      };
      this.getMapExtentInEpsg4326 = function () {};
    });
    angular.mock.module('hs.compositions');
  }); //<--- Hook module

  beforeEach(
    angular.mock.inject(function (_$componentController_, $rootScope) {
      scope = $rootScope.$new();
      $componentController = _$componentController_;
    })
  );

  beforeEach(
    angular.mock.inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      // backend definition common for all tests
      $httpBackend.when('GET', 'http://cat.ccss.cz/csw/').respond({
        'matched': 25,
        'returned': 15,
        'next': 16,
        'records': [
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '4e4a629c-d09e-476e-b750-d3e847ac47d9',
            'title': 'Swedish municipalities',
            'mdAbstract': 'Map displays municipalities in Sweden',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=4e4a629c-d09e-476e-b750-d3e847ac47d9',
            'bbox': '11 55 24 68',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '71edfa62-5079-47c9-b227-3c9d6cf8a240',
            'title': 'Livestock and its structure in NUTS regions in year 2003',
            'mdAbstract':
              'The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows livestock structure in NUTS regions across Europe; diagram map, that shows the amount of livestock units (see what is livestock unit: http://epp.eurostat.ec.europa.eu/statistics_explained/index.php/Glossary:LSU ) in certain region and finally info-',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=71edfa62-5079-47c9-b227-3c9d6cf8a240',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': '',
            'id': '5256456a-3fe8-488b-92d2-0273585671e2',
            'title': 'Complex composition of Europe',
            'mdAbstract':
              'This is a complex composition containing data from many different tables (describing different aspects of life) from Eurostat. The given topics are visualized using different techniques. The data is for the administrative levels of NUTS0-3.',
            'link':
              'http://dev.bnhelp.cz/statusmanager/index.php?request=load&permalink=eu_complex',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '952267f7-048e-4676-bcf3-fbfc58c6d4d6',
            'title': 'Spatial Plans',
            'mdAbstract':
              'Composition shows available spatial plans hormonized according to INSPIRE-HILUCS specifications.',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=952267f7-048e-4676-bcf3-fbfc58c6d4d6',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '7ea2beb4-5ecb-47d3-ac0b-ecce712439b3',
            'title': 'Coarse particle pollution in Europe in year 2011',
            'mdAbstract':
              'The composition shows measurements of PM10 (coarse particles) air pollution from different stations around the Europe. The unit of measurements is \u00b5g/m3. The data is from EEA database and is for year 2011.',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=7ea2beb4-5ecb-47d3-ac0b-ecce712439b3',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': 'fe3d4424-0ec3-440d-82dd-9d2915e1b592',
            'title':
              'Cultivated land and its structure in NUTS regions in year 2007',
            'mdAbstract':
              'The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows usage of cultivated land in NUTS regions across Europe; diagram map, that shows the amount of cultivated land in certain region and finally info-layers, that are clickable and display exact numbers(amount of cultivated land and structure of usage. ',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=fe3d4424-0ec3-440d-82dd-9d2915e1b592',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '91f3dd09-6c32-415b-a189-4a092d752242',
            'title': 'Ecoregions by EEA',
            'mdAbstract':
              'Map shows ecoregions in Europe. The data are taken from database of European Environmental Agency.',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=91f3dd09-6c32-415b-a189-4a092d752242',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '11bee4d9-3a2e-4215-96d5-a20286ab9913',
            'title': 'Population distribution in NUTS regions',
            'mdAbstract':
              'The given composition shows distribution of population by NUTS regions. The viewer should get an idea of how many people live in each of NUTS regions and also about how dense they are populated. The map itself consists of three main components :base layer (shows boarders and codes of NUTS regions), choropleth map (that shows density of population) and spheres (volume of sphere is proportional to ',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=11bee4d9-3a2e-4215-96d5-a20286ab9913',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '44a62e48-6f86-4d57-9de9-3018f6fee4a5',
            'title':
              'Cultivated land and its structure in NUTS regions in year 2005',
            'mdAbstract':
              'The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows usage of cultivated land in NUTS regions across Europe; diagram map, that shows the amount of cultivated land in certain region and finally info-layers, that are clickable and display exact numbers(amount of cultivated land and structure of usage. ',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=44a62e48-6f86-4d57-9de9-3018f6fee4a5',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '011339ee-8232-40ca-915d-8ff88e5b7c3f',
            'title': 'Livestock and its structure in NUTS regions in year 2005',
            'mdAbstract':
              'The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows livestock structure in NUTS regions across Europe; diagram map, that shows the amount of livestock units (see what is livestock unit: http://epp.eurostat.ec.europa.eu/statistics_explained/index.php/Glossary:LSU ) in certain region and finally info-',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=011339ee-8232-40ca-915d-8ff88e5b7c3f',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '10b28329-39bd-4c2a-a672-08b269b637f4',
            'title': 'Livestock and its structure in NUTS regions in year 2007',
            'mdAbstract':
              'The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows livestock structure in NUTS regions across Europe; diagram map, that shows the amount of livestock units (see what is livestock unit: http://epp.eurostat.ec.europa.eu/statistics_explained/index.php/Glossary:LSU ) in certain region and finally info-',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=10b28329-39bd-4c2a-a672-08b269b637f4',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '1e0c7685-fefa-4f13-9d92-717dca6bd778',
            'title': 'Common Database on Designated Areas (CDDA)',
            'mdAbstract':
              'Map shows nationally designated areas (CDDA) in Europe in year 2011. The data are taken from database of European Environmental Agency.',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=1e0c7685-fefa-4f13-9d92-717dca6bd778',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '72f23f99-0697-47ab-b028-d541003f97ee',
            'title':
              'Occupation of people by ISCO (for year 2001) codes and rate of unemployment (for year 2011) in NUTS 1,3 regions',
            'mdAbstract':
              'The following map compositions consists of three main components choropleth map that shows percentage of unemployed people in given region, then also basic map with administrative boarders of NUTS regions and its codes and finally diagram map representing population occupation structure by ISCO classification. The size of each diagram is proportional to number of employed people. The data is take',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=72f23f99-0697-47ab-b028-d541003f97ee',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '39499777-997e-48ec-97c3-3fa14947f4f0',
            'title': 'GDP per capita in NUTS regions in year 2010',
            'mdAbstract':
              'The map composition consists of three main componenets. Base layer which is just boarders and names of NUTS regions. Choropleth map, that shows if the GDP per capita in given NUTS region is higher or lower than EU average and by how many percents. For regions that have higher GDP than the average shades of red are used, and for regions that have less GDP than the average shades of blue are used. ',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=39499777-997e-48ec-97c3-3fa14947f4f0',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
          {
            'trida': 'application',
            'serviceType': 'WMC',
            'id': '14acaefb-7305-493c-a41a-344ae1821998',
            'title':
              'Cultivated land and its structure in NUTS regions in year 2003',
            'mdAbstract':
              'The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows usage of cultivated land in NUTS regions across Europe; diagram map, that shows the amount of cultivated land in certain region and finally info-layers, that are clickable and display exact numbers(amount of cultivated land and structure of usage. ',
            'link':
              'http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=14acaefb-7305-493c-a41a-344ae1821998',
            'bbox': '-10.159 36.778 31.164 71.462',
            'contact': '',
          },
        ],
      });
    })
  );
  it('compositions list should load', function () {
    const ctrl = $componentController('hs.compositions', {$scope: scope}, {});
    ctrl.compositions = [];
    scope.filterByExtent = false;

    /*
            if (!(req.url.indexOf('www.whatstheplan.eu/p4b-dev/cat/catalogue') > 0))
                d.resolve({ "matched": 25, "returned": 15, "next": 16, "records": [{ "trida": "application", "serviceType": "WMC", "id": "4e4a629c-d09e-476e-b750-d3e847ac47d9", "title": "Swedish municipalities", "mdAbstract": "Map displays municipalities in Sweden", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=4e4a629c-d09e-476e-b750-d3e847ac47d9", "bbox": "11 55 24 68", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "71edfa62-5079-47c9-b227-3c9d6cf8a240", "title": "Livestock and its structure in NUTS regions in year 2003", "mdAbstract": "The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows livestock structure in NUTS regions across Europe; diagram map, that shows the amount of livestock units (see what is livestock unit: http:\/\/epp.eurostat.ec.europa.eu\/statistics_explained\/index.php\/Glossary:LSU ) in certain region and finally info-", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=71edfa62-5079-47c9-b227-3c9d6cf8a240", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "", "id": "5256456a-3fe8-488b-92d2-0273585671e2", "title": "Complex composition of Europe", "mdAbstract": "This is a complex composition containing data from many different tables (describing different aspects of life) from Eurostat. The given topics are visualized using different techniques. The data is for the administrative levels of NUTS0-3.", "link": "http:\/\/dev.bnhelp.cz\/statusmanager\/index.php?request=load&permalink=eu_complex", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "952267f7-048e-4676-bcf3-fbfc58c6d4d6", "title": "Spatial Plans", "mdAbstract": "Composition shows available spatial plans hormonized according to INSPIRE-HILUCS specifications.", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=952267f7-048e-4676-bcf3-fbfc58c6d4d6", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "7ea2beb4-5ecb-47d3-ac0b-ecce712439b3", "title": "Coarse particle pollution in Europe in year 2011", "mdAbstract": "The composition shows measurements of PM10 (coarse particles) air pollution from different stations around the Europe. The unit of measurements is \u00b5g\/m3. The data is from EEA database and is for year 2011.", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=7ea2beb4-5ecb-47d3-ac0b-ecce712439b3", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "fe3d4424-0ec3-440d-82dd-9d2915e1b592", "title": "Cultivated land and its structure in NUTS regions in year 2007", "mdAbstract": "The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows usage of cultivated land in NUTS regions across Europe; diagram map, that shows the amount of cultivated land in certain region and finally info-layers, that are clickable and display exact numbers(amount of cultivated land and structure of usage. ", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=fe3d4424-0ec3-440d-82dd-9d2915e1b592", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "91f3dd09-6c32-415b-a189-4a092d752242", "title": "Ecoregions by EEA", "mdAbstract": "Map shows ecoregions in Europe. The data are taken from database of European Environmental Agency.", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=91f3dd09-6c32-415b-a189-4a092d752242", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "11bee4d9-3a2e-4215-96d5-a20286ab9913", "title": "Population distribution in NUTS regions", "mdAbstract": "The given composition shows distribution of population by NUTS regions. The viewer should get an idea of how many people live in each of NUTS regions and also about how dense they are populated. The map itself consists of three main components :base layer (shows boarders and codes of NUTS regions), choropleth map (that shows density of population) and spheres (volume of sphere is proportional to ", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=11bee4d9-3a2e-4215-96d5-a20286ab9913", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "44a62e48-6f86-4d57-9de9-3018f6fee4a5", "title": "Cultivated land and its structure in NUTS regions in year 2005", "mdAbstract": "The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows usage of cultivated land in NUTS regions across Europe; diagram map, that shows the amount of cultivated land in certain region and finally info-layers, that are clickable and display exact numbers(amount of cultivated land and structure of usage. ", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=44a62e48-6f86-4d57-9de9-3018f6fee4a5", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "011339ee-8232-40ca-915d-8ff88e5b7c3f", "title": "Livestock and its structure in NUTS regions in year 2005", "mdAbstract": "The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows livestock structure in NUTS regions across Europe; diagram map, that shows the amount of livestock units (see what is livestock unit: http:\/\/epp.eurostat.ec.europa.eu\/statistics_explained\/index.php\/Glossary:LSU ) in certain region and finally info-", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=011339ee-8232-40ca-915d-8ff88e5b7c3f", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "10b28329-39bd-4c2a-a672-08b269b637f4", "title": "Livestock and its structure in NUTS regions in year 2007", "mdAbstract": "The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows livestock structure in NUTS regions across Europe; diagram map, that shows the amount of livestock units (see what is livestock unit: http:\/\/epp.eurostat.ec.europa.eu\/statistics_explained\/index.php\/Glossary:LSU ) in certain region and finally info-", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=10b28329-39bd-4c2a-a672-08b269b637f4", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "1e0c7685-fefa-4f13-9d92-717dca6bd778", "title": "Common Database on Designated Areas (CDDA)", "mdAbstract": "Map shows nationally designated areas (CDDA) in Europe in year 2011. The data are taken from database of European Environmental Agency.", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=1e0c7685-fefa-4f13-9d92-717dca6bd778", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "72f23f99-0697-47ab-b028-d541003f97ee", "title": "Occupation of people by ISCO (for year 2001) codes and rate of unemployment (for year 2011) in NUTS 1,3 regions", "mdAbstract": "The following map compositions consists of three main components choropleth map that shows percentage of unemployed people in given region, then also basic map with administrative boarders of NUTS regions and its codes and finally diagram map representing population occupation structure by ISCO classification. The size of each diagram is proportional to number of employed people. The data is take", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=72f23f99-0697-47ab-b028-d541003f97ee", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "39499777-997e-48ec-97c3-3fa14947f4f0", "title": "GDP per capita in NUTS regions in year 2010", "mdAbstract": "The map composition consists of three main componenets. Base layer which is just boarders and names of NUTS regions. Choropleth map, that shows if the GDP per capita in given NUTS region is higher or lower than EU average and by how many percents. For regions that have higher GDP than the average shades of red are used, and for regions that have less GDP than the average shades of blue are used. ", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=39499777-997e-48ec-97c3-3fa14947f4f0", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }, { "trida": "application", "serviceType": "WMC", "id": "14acaefb-7305-493c-a41a-344ae1821998", "title": "Cultivated land and its structure in NUTS regions in year 2003", "mdAbstract": "The map composition consists of four main componenets. Base layer which is just boarders and names of NUTS regions. Structural diagram map, that shows usage of cultivated land in NUTS regions across Europe; diagram map, that shows the amount of cultivated land in certain region and finally info-layers, that are clickable and display exact numbers(amount of cultivated land and structure of usage. ", "link": "http:\/\/www.whatstheplan.eu\/wwwlibs\/statusmanager2\/index.php?request=load&id=14acaefb-7305-493c-a41a-344ae1821998", "bbox": "-10.159 36.778 31.164 71.462", "contact": "" }] });
            else
                d.resolve({ "success": true, "results": [{ "id": "9f7af9fd-ad7f-44a0-b953-51c4e487cbd1", "title": "test", "abstract": "", "extent": [42.737206441986, 39.396478327701, 46.403893453194, 40.874652880637], "updated": "2015-10-23T11:03:17" }, { "id": "eda7c5c8-d4f7-454b-9ada-329c53027498", "title": "New composition", "abstract": "Test", "extent": [15.246823103975, 49.948881981057, 15.361407073076, 49.990948507028], "updated": "2015-11-26T12:40:09" }] });
         */
    const ds: any = {
      url: 'http://cat.ccss.cz/csw/',
      type: 'micka',
      title: 'SuperCAT',
      compositionsPaging: {
        start: 0,
        limit: 15,
        loaded: false,
      },
    };
    scope.loadCompositions(ds).then(function () {
      expect(ds.compositions).toBeDefined();
    });
  });

  it('if "Only mine" is unchecked then query.editable should not be sent at all', function () {
    $componentController('hs.compositions', {$scope: scope}, {});
    scope.query = {editable: false};
    scope.mineFilterChanged();
    expect(scope.query.editable).toBeUndefined();
  });
});
