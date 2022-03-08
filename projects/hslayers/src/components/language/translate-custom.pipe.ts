import {
  ChangeDetectorRef,
  Injectable,
  Pipe,
  PipeTransform,
} from '@angular/core';
import {HsLanguageService} from './language.service';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
@Injectable()
@Pipe({
  name: 'translateHs',
  pure: false, // required to update the value when the promise is resolved
})
export class TranslateCustomPipe
  extends TranslatePipe
  implements PipeTransform {
  onLangChangeOverridden: boolean;
  constructor(
    private translate2: TranslateService,
    private _theRef: ChangeDetectorRef,
    private hsLanguageService: HsLanguageService
  ) {
    super(translate2, _theRef);
  }

  transform(query: string, ...args: any[]) {
    if (equals(query, this.lastKey) && equals(args, this.lastParams)) {
      return this.value;
    }
    let interpolateParams: any | undefined = undefined;
    if (args[0] && args.length) {
      if (typeof args[0] === 'string' && args[0].length) {
        // we accept objects written in the template such as {n:1}, {'n':1}, {n:'v'}
        // which is why we might need to change it to real JSON objects such as {"n":1} or {"n":"v"}
        const validArgs: string = args[0]
          .replace(/(\')?([a-zA-Z0-9_]+)(\')?(\s)?:/g, '"$2":')
          .replace(/:(\s)?(\')(.*?)(\')/g, ':"$3"');
        try {
          interpolateParams = JSON.parse(validArgs);
        } catch (e) {
          throw new SyntaxError(
            `Wrong parameter in TranslatePipe. Expected a valid Object, received: ${args[0]}`
          );
        }
      } else if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
        interpolateParams = args[0];
      }
    }

    this.lastKey = query;

    // store the params, in case they change
    this.lastParams = args;

    const onTranslation = (res: string) => {
      this.value = res !== undefined ? res : query;
      this.lastKey = query;
    };
    this.hsLanguageService
      .getTranslator(interpolateParams.app)
      .get(query)
      .subscribe(onTranslation);
    return this.value;
  }
}

export function equals(o1: any, o2: any): boolean {
  if (o1 === o2) {
    return true;
  }
  if (o1 === null || o2 === null) {
    return false;
  }
  if (o1 !== o1 && o2 !== o2) {
    return true;
  } // NaN === NaN
  let t1 = typeof o1,
    t2 = typeof o2,
    length: number,
    key: any,
    keySet: any;
  if (t1 == t2 && t1 == 'object') {
    if (Array.isArray(o1)) {
      if (!Array.isArray(o2)) {
        return false;
      }
      if ((length = o1.length) == o2.length) {
        for (key = 0; key < length; key++) {
          if (!equals(o1[key], o2[key])) {
            return false;
          }
        }
        return true;
      }
    } else {
      if (Array.isArray(o2)) {
        return false;
      }
      keySet = Object.create(null);
      for (key in o1) {
        if (!equals(o1[key], o2[key])) {
          return false;
        }
        keySet[key] = true;
      }
      for (key in o2) {
        if (!(key in keySet) && typeof o2[key] !== 'undefined') {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}
