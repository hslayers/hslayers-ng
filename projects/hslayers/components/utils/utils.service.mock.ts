export class HsUtilsServiceMock {
  constructor() {}

  isPOJO(objectToCheck) {
    return (
      objectToCheck && {}.toString.call(objectToCheck) === '[object Object]'
    );
  }

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
  debounce(func, wait, immediate, context) {
    if (context === undefined) {
      context = this;
    }
    return function (...args) {
      const later = function () {
        if (!immediate) {
          func.apply(context, args);
        }
        context.timeout = null;
      };
      const callNow = immediate && !context.timeout;
      clearTimeout(context.timeout);
      context.timeout = setTimeout(later, wait);
      if (callNow) {
        func.apply(context, args);
      }
    };
  }
  generateUuid() {
    return Math.random().toString();
  }
  runningInBrowser(): boolean {
    return true;
  }
  structuredClone(from, to?) {
    return from;
  }

  isFunction(functionToCheck) {
    return (
      functionToCheck &&
      {}.toString.call(functionToCheck) === '[object Function]'
    );
  }

  capitalizeFirstLetter(target: string): string {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }

  camelToKebab(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  proxify(url, toEncoding) {
    return '/proxy/' + url;
  }
  hashCode(s: string): number {
    let hash = 0;
    if (s.length == 0) {
      return hash;
    }
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
  resolveEsModule(module) {
    return module || module.default;
  }
  removeDuplicates(dirtyArray: any, property: string): any {
    const propertyChain = property.split('.');
    const flatArray = [...dirtyArray];
    for (const prop of propertyChain) {
      for (const idx in flatArray) {
        if (flatArray[idx] === undefined) {
          return [];
        }
        flatArray[idx] =
          flatArray[idx].get !== undefined
            ? flatArray[idx].get(
                prop,
              ) /* get() is only defined for OL objects */
            : flatArray[idx][prop]; /* POJO access */
      }
    }
    return dirtyArray.filter((item, position) => {
      let propertyValue = item;
      for (const prop of propertyChain) {
        propertyValue =
          propertyValue.get !== undefined
            ? propertyValue.get(prop) /* get() is only defined for OL objects */
            : propertyValue[prop]; /* POJO access */
      }
      return flatArray.indexOf(propertyValue) === position;
    });
  }
  undefineEmptyString(str: string): any {
    if (str === undefined) {
      return undefined;
    }
    return str.trim() != '' ? str : undefined;
  }

  getParamsFromUrl() {
    return {};
  }
}
