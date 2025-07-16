import {TestBed} from '@angular/core/testing';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {HsConfig} from 'hslayers-ng/config';
import {HsProxyService} from 'hslayers-ng/services/utils';

describe('HsProxyService', () => {
  let service: HsProxyService;
  let hsConfig: HsConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HsProxyService, HsConfig, provideHttpClientTesting()],
    });
    service = TestBed.inject(HsProxyService);
    hsConfig = TestBed.inject(HsConfig);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('check if url gets proxified correctly', () => {
    const urlWMS = 'http://gisserver.domain.com/request=GetFeatureInfo';
    const simpleUrl = 'http://gisserver.domain.com';
    const base64Url =
      'data:application/octet-stream;base64,PGttbD4KICA8RG9jdW1lbnQ+CiAgICA8bmFtZT5T';
    let url = service.proxify(urlWMS);
    expect(url).toEqual(
      '/proxy/http://gisserver.domain.com/request=GetFeatureInfo',
    );
    hsConfig.proxyPrefix = 'http://localhost:8085/';
    url = service.proxify(simpleUrl);
    expect(url).toEqual('http://localhost:8085/http://gisserver.domain.com');
    url = service.proxify(base64Url);
    expect(url).toEqual(
      'data:application/octet-stream;base64,PGttbD4KICA8RG9jdW1lbnQ+CiAgICA8bmFtZT5T',
    );
  });
});
