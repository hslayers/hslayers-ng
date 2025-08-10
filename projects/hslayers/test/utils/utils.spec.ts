import {LineString, Point, Polygon} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';

import {
  instOf,
  getPortFromUrl,
  getParamsFromUrl,
  paramsToURL,
  paramsToURLWoEncode,
  isFunction,
  isPOJO,
  capitalizeFirstLetter,
  undefineEmptyString,
  formatLength,
  formatArea,
} from 'hslayers-ng/services/utils';

describe('Standalone Utils', () => {
  it('create a deep copy of any object', () => {
    const obj = {
      date: new Date(),
      num: 123,
      text: 'text',
      array: [1, 'text'],
      regex: new RegExp(/text/i),
      subobj: {
        num: 234,
        text: 'text',
      },
    };
    // Use standard structuredClone
    const copy = structuredClone(obj);
    expect(copy).not.toBe(obj);
    expect(copy).toEqual(obj);
    delete obj.subobj;
    expect(copy.subobj).toBeDefined();
  });

  // Tests for proxify and shortUrl moved to proxy.service.spec.ts

  it('try to get port number from url', () => {
    let url = 'http://localhost:';
    // Call the standalone function directly
    let portNumber = getPortFromUrl(url);
    expect(portNumber).toEqual('80');
    url = 'https://localhost:';
    portNumber = getPortFromUrl(url);
    expect(portNumber).toEqual('443');
    url = 'https://localhost:8080';
    portNumber = getPortFromUrl(url);
    expect(portNumber).toEqual('8080');
  });

  it('try to get parameters from url', () => {
    const url = 'http://localhost:8080?param1=test&param2=test2';
    // Call the standalone function directly
    const params = getParamsFromUrl(url);
    expect(params).toEqual({param1: 'test', param2: 'test2'});
  });

  it('try to create parameters for url', () => {
    const params = {'#param1': 'test', '#param2': 'test2'};
    // Call the standalone function directly
    const pairs = paramsToURL(params);
    expect(pairs).toEqual('%23param1=test&%23param2=test2');
  });

  it('try to create parameters for url without encoding', () => {
    const params = {'#param1': 'test', '#param2': 'test2'};
    // Call the standalone function directly
    const pairs = paramsToURLWoEncode(params);
    expect(pairs).toEqual('#param1=test&#param2=test2');
  });

  // it('try to generate Uuid', () => {
  //   // Call the standalone function directly
  //   const Uuid = generateUuid();
  //   expect(Uuid).toBeDefined();
  // });

  // it('try to generate generate vibrant color', () => {
  //   const numOfSteps = 5;
  //   const step = 1;
  //   const opacity = '0.5';
  //   // Call the standalone function directly
  //   const color = rainbow(numOfSteps, step, opacity);
  //   expect(color).toEqual('rgba(0,187,235, 0.5)');
  // });

  it('check if object is a function', () => {
    const functionToCheck = function () {
      return;
    };
    const functionToCheck2 = {
      function: function () {
        return;
      },
    };
    // Call the standalone function directly
    let isFuncResult = isFunction(functionToCheck);
    expect(isFuncResult).toBe(true);
    isFuncResult = isFunction(functionToCheck2);
    expect(isFuncResult).toBe(false);
  });

  it('check if object is a object', () => {
    const objectToCheck = {name: 'object'};
    const objectToCheck2 = function () {
      return;
    };
    // Call the standalone function directly
    let isObject = isPOJO(objectToCheck);
    expect(isObject).toBe(true);
    isObject = isPOJO(objectToCheck2);
    expect(isObject).toBe(false);
  });

  it('check if object is instance of some type', () => {
    const layer = new VectorLayer();
    // Call the standalone function directly
    let isInstOf = instOf(layer, VectorLayer);
    expect(isInstOf).toBe(true);
    isInstOf = instOf(layer, Point);
    expect(isInstOf).toBe(false);
  });

  it('try to capitalize first string letter', () => {
    const str = 'this string will have atleast one capital letter';
    // Call the standalone function directly
    const result = capitalizeFirstLetter(str);
    expect(result).toEqual('This string will have atleast one capital letter');
  });

  it('try to undefine an empty string', () => {
    let str = 'this is now an empty string';
    // Call the standalone function directly
    let result = undefineEmptyString(str);
    expect(result).toEqual('this is now an empty string');
    str = '';
    result = undefineEmptyString(str);
    expect(result).toEqual(undefined);
    str = undefined;
    result = undefineEmptyString(str);
    expect(result).toEqual(undefined);
  });

  it('format length measurements', () => {
    let measuredLine = new LineString([
      [16223, 48456],
      [234, 785],
    ]);
    // Call the standalone function directly
    let measurement = formatLength(measuredLine, 'EPSG:3857');
    expect(measurement.unit).toBe('km');
    expect(measurement.size).toBeGreaterThan(0);
    measuredLine = new LineString([
      [12, 50],
      [13, 49],
    ]);
    measurement = formatLength(measuredLine, 'EPSG:3857');
    expect(measurement.unit).toBe('m');
    expect(measurement.size).toBeGreaterThan(0);
  });

  it('format area measurements', () => {
    let measuredArea = new Polygon([
      [
        [1623, 47627],
        [234, 785],
        [-156, -61],
        [1623, 47627], // Close the polygon
      ],
    ]);
    // Call the standalone function directly
    let measurement = formatArea(measuredArea, 'EPSG:3857');
    expect(measurement.unit).toBe('km');
    expect(measurement.size).toBeGreaterThan(0);
    measuredArea = new Polygon([
      [
        [12, 50],
        [13, 49],
        [13, 50],
        [12, 50], // Close the polygon
      ],
    ]);
    measurement = formatArea(measuredArea, 'EPSG:4326');
    expect(measurement.unit).toBe('m');
    expect(measurement.size).toBeGreaterThan(0);
  });
});
