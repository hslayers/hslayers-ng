import {HsEndpoint, HsLaymanLayerDescriptor} from 'hslayers-ng/types';
import {
  getLaymanFriendlyLayerName,
  wfsNotAvailable,
  layerParamPendingOrStarting,
  wfsFailed,
  getSupportedSrsList,
  isAtLeastVersions,
  isLaymanUrl,
  SUPPORTED_SRS_LIST,
} from 'hslayers-ng/common/layman';

describe('Layman Utils', () => {
  describe('getLaymanFriendlyLayerName', () => {
    it('should transliterate, lowercase, and replace invalid characters', () => {
      expect(getLaymanFriendlyLayerName('Test Title ČŠŽ')).toBe(
        'test_title_csz',
      );
      expect(getLaymanFriendlyLayerName('Layer with spaces')).toBe(
        'layer_with_spaces',
      );
      expect(getLaymanFriendlyLayerName('Layer-with-dashes_and.dots')).toBe(
        'layer_with_dashes_and_dots',
      );
      expect(
        getLaymanFriendlyLayerName('  Layer with surrounding spaces  '),
      ).toBe('layer_with_surrounding_spaces');
      expect(getLaymanFriendlyLayerName('Layer With non-ASCII éàç')).toBe(
        'layer_with_non_ascii_eac',
      );
      expect(
        getLaymanFriendlyLayerName('Layer__with--multiple___separators'),
      ).toBe('layer_with_multiple_separators');
      expect(getLaymanFriendlyLayerName('Invalid&*^%Chars')).toBe(
        'invalidchars',
      );
      expect(getLaymanFriendlyLayerName('')).toBe('');
      expect(getLaymanFriendlyLayerName('__--..')).toBe('_'); //Edge case: only separators
    });
  });

  describe('WFS Status Checks', () => {
    const descrNotAvailable: HsLaymanLayerDescriptor = {
      name: 'test',
      wfs: {status: 'NOT_AVAILABLE'},
    };
    const descrPending: HsLaymanLayerDescriptor = {
      name: 'test',
      wfs: {status: 'PENDING'},
    };
    const descrStarted: HsLaymanLayerDescriptor = {
      name: 'test',
      wfs: {status: 'STARTED'},
    };
    const descrFailure: HsLaymanLayerDescriptor = {
      name: 'test',
      wfs: {status: 'FAILURE'},
    };
    const descrUndefined: HsLaymanLayerDescriptor = {name: 'test'};
    const descrWfsUndefined: HsLaymanLayerDescriptor = {
      name: 'test',
      wfs: undefined,
    };

    it('wfsNotAvailable should return true only when status is NOT_AVAILABLE', () => {
      expect(wfsNotAvailable(descrNotAvailable)).toBeTrue();
      expect(wfsNotAvailable(descrPending)).toBeFalse();
      expect(wfsNotAvailable(descrStarted)).toBeFalse();
      expect(wfsNotAvailable(descrFailure)).toBeFalse();
      expect(wfsNotAvailable(descrUndefined)).toBeFalse(); // No wfs property
      expect(wfsNotAvailable(descrWfsUndefined)).toBeFalse(); // wfs undefined
    });

    it('wfsFailed should return true only when status is FAILURE', () => {
      expect(wfsFailed(descrFailure)).toBeTrue();
      expect(wfsFailed(descrNotAvailable)).toBeFalse();
      expect(wfsFailed(descrPending)).toBeFalse();
      expect(wfsFailed(descrStarted)).toBeFalse();
      expect(wfsFailed(descrUndefined)).toBeFalse(); // No wfs property
      expect(wfsFailed(descrWfsUndefined)).toBeFalse(); // wfs undefined
    });
  });

  describe('layerParamPendingOrStarting', () => {
    const descr: any = {
      wms: {status: 'AVAILABLE'},
      wfs: {status: 'PENDING'},
      tms: {status: 'STARTED'},
      other: {status: 'FAILURE'},
    };
    const descrMissing: any = {wms: {status: 'AVAILABLE'}};

    it('should return true if param status is PENDING', () => {
      expect(layerParamPendingOrStarting(descr, 'wfs')).toBeTrue();
    });

    it('should return true if param status is STARTED', () => {
      expect(layerParamPendingOrStarting(descr, 'tms')).toBeTrue();
    });

    it('should return false if param status is not PENDING or STARTED', () => {
      expect(layerParamPendingOrStarting(descr, 'wms')).toBeFalse();
      expect(layerParamPendingOrStarting(descr, 'other')).toBeFalse();
    });

    it('should return false if param does not exist or status is missing', () => {
      expect(layerParamPendingOrStarting(descr, 'nonexistent')).toBeFalse();
      expect(layerParamPendingOrStarting(descrMissing, 'wfs')).toBeFalse();
      const descrNoStatus: any = {wfs: {}};
      expect(layerParamPendingOrStarting(descrNoStatus, 'wfs')).toBeFalse();
    });
  });

  describe('isAtLeastVersions', () => {
    const ep: HsEndpoint = {
      type: 'layman',
      title: 'test',
      url: 'http://test.com',
      version: '',
    };

    it('should correctly compare versions', () => {
      ep.version = '1.16.0';
      expect(isAtLeastVersions(ep, '1.16.0')).toBeTrue();
      expect(isAtLeastVersions(ep, '1.15.9')).toBeTrue();
      expect(isAtLeastVersions(ep, '1.16.1')).toBeFalse();
      expect(isAtLeastVersions(ep, '2.0.0')).toBeFalse();
      expect(isAtLeastVersions(ep, '1.15.10')).toBeTrue(); // Lexical vs numeric

      ep.version = '1.15.10';
      expect(isAtLeastVersions(ep, '1.16.0')).toBeFalse();
      expect(isAtLeastVersions(ep, '1.15.9')).toBeTrue();

      ep.version = '2.0.0';
      expect(isAtLeastVersions(ep, '1.16.0')).toBeTrue();
      expect(isAtLeastVersions(ep, '2.0.0')).toBeTrue();
      expect(isAtLeastVersions(ep, '2.0.1')).toBeFalse();

      // Different lengths
      ep.version = '1.16';
      expect(isAtLeastVersions(ep, '1.16.0')).toBeTrue();
      expect(isAtLeastVersions(ep, '1.15.9')).toBeTrue();
      expect(isAtLeastVersions(ep, '1.16.1')).toBeFalse();
      ep.version = '1.16.1';
      expect(isAtLeastVersions(ep, '1.16')).toBeTrue();
    });
  });

  describe('getSupportedSrsList', () => {
    const ep: HsEndpoint = {
      type: 'layman',
      title: 'test',
      url: 'http://test.com',
      version: '',
    };

    it('should return full list for version 1.16.0 or higher', () => {
      ep.version = '1.15.9';
      expect(getSupportedSrsList(ep)).toEqual(SUPPORTED_SRS_LIST.slice(0, 2));
      ep.version = '1.16.0';
      expect(getSupportedSrsList(ep)).toEqual(SUPPORTED_SRS_LIST);
      ep.version = '2.0.0';
      expect(getSupportedSrsList(ep)).toEqual(SUPPORTED_SRS_LIST);
    });
  });

  fdescribe('isLaymanUrl', () => {
    const laymanEp: HsEndpoint = {
      type: 'layman',
      title: 'layman',
      url: 'http://layman.domain/layman',
      version: '1.0.0',
    };
    const wagtailEp: HsEndpoint = {
      type: 'layman-wagtail',
      title: 'wagtail',
      url: 'http://wagtail.domain/layman-proxy/',
      version: '1.0.0',
    };
    const undefinedEp = undefined as unknown as HsEndpoint;
    const nullEp = null as unknown as HsEndpoint;

    it('should return false if endpoint is null or undefined', () => {
      expect(isLaymanUrl('http://some.url', undefinedEp)).toBeFalse();
      expect(isLaymanUrl('http://some.url', nullEp)).toBeFalse();
    });

    it('should return true if url includes layman-proxy', () => {
      expect(
        isLaymanUrl('http://any.domain/layman-proxy/wms', laymanEp),
      ).toBeTrue();
      expect(
        isLaymanUrl('http://any.domain/layman-proxy/wms', wagtailEp),
      ).toBeTrue();
    });

    it('should return true if url includes standard layman endpoint url', () => {
      expect(
        isLaymanUrl('http://layman.domain/layman/wms?service=wms', laymanEp),
      ).toBeTrue();
      expect(
        isLaymanUrl('http://other.domain/layman/wms', laymanEp),
      ).toBeFalse();
    });

    it('should return true if url includes base wagtail endpoint url (before layman-proxy)', () => {
      // Wagtail uses the part before layman-proxy for the check if layman-proxy isn't present
      expect(
        isLaymanUrl('http://wagtail.domain/some/path', wagtailEp),
      ).toBeTrue();
      expect(
        isLaymanUrl('http://other.domain/some/path', wagtailEp),
      ).toBeFalse();
    });

    it('should return false for non-layman URLs', () => {
      expect(isLaymanUrl('http://other.service/wms', laymanEp)).toBeFalse();
      expect(isLaymanUrl('http://other.service/wms', wagtailEp)).toBeFalse();
      expect(isLaymanUrl('', laymanEp)).toBeFalse();
    });
  });
});
