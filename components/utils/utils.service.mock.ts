import * as angular from 'angular';
export class HsUtilsServiceMock {
  constructor() {}

  instOf(obj, type) {
    return this._instanceOf(obj, type);
  }

  _instanceOf(obj, klass) {
    if (this.isFunction(klass)) {
      return obj instanceof klass;
    }
    obj = Object.getPrototypeOf(obj);
    while (obj !== null) {
      if (obj.constructor.name === klass) {
        return true;
      }
      obj = Object.getPrototypeOf(obj);
    }
    return false;
  }

  generateUuid() {
    return Math.random().toString();
  }

  isFunction(functionToCheck) {
    return (
      functionToCheck &&
      {}.toString.call(functionToCheck) === '[object Function]'
    );
  }

  proxify(url, toEncoding) {
    return '/proxy/' + url;
  }
  removeDuplicates(dirtyArray: any, property: string): any {
    const propertyChain = property.split('.');
    const flatArray = [...dirtyArray];
    for (const prop of propertyChain) {
      for (const idx in flatArray) {
        if (angular.isUndefined(flatArray[idx])) {
          return [];
        }
        flatArray[idx] = angular.isDefined(flatArray[idx].get)
          ? flatArray[idx].get(prop) /* get() is only defined for OL objects */
          : flatArray[idx][prop]; /* POJO access */
      }
    }
    return dirtyArray.filter((item, position) => {
      let propertyValue = item;
      for (const prop of propertyChain) {
        propertyValue = angular.isDefined(propertyValue.get)
          ? propertyValue.get(prop) /* get() is only defined for OL objects */
          : propertyValue[prop]; /* POJO access */
      }
      return flatArray.indexOf(propertyValue) === position;
    });
  }
}
