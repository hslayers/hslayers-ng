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

  generateUuid(){
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
}
