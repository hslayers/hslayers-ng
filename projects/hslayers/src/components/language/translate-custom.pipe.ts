import {
  ChangeDetectorRef,
  Injectable,
  Pipe,
  PipeTransform,
} from '@angular/core';
import {
  LangChangeEvent,
  TranslatePipe,
  TranslationChangeEvent,
} from '@ngx-translate/core';

import {CustomTranslationService} from './custom-translate.service';
import {HsLanguageService} from './language.service';

@Injectable()
@Pipe({
  name: 'translateHs',
  standalone: true,
  pure: false, // required to update the value when the promise is resolved
})
export class TranslateCustomPipe
  extends TranslatePipe
  implements PipeTransform
{
  onLangChangeOverridden: boolean;
  constructor(
    private translate2: CustomTranslationService,
    private _theRef: ChangeDetectorRef,
    private hsLanguageService: HsLanguageService,
  ) {
    super(translate2, _theRef);
  }

  transform(query: string, ...args: any[]) {
    if (query == undefined || query == '') {
      return query;
    }
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
            `Wrong parameter in TranslatePipe. Expected a valid Object, received: ${args[0]}`,
          );
        }
      } else if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
        interpolateParams = args[0];
      }
    }

    let module: string;
    if (interpolateParams?.module != undefined) {
      module = interpolateParams.module;
    }
    const translator = this.hsLanguageService.getTranslator();
    if (!this.onTranslationChange) {
      this.onTranslationChange = translator.onTranslationChange.subscribe(
        (event: TranslationChangeEvent) => {
          if (this.lastKey && event.lang === translator.currentLang) {
            this.lastKey = null;
            this.updateTranslation(query, translator, module);
          }
        },
      );
    }

    // subscribe to onLangChange event, in case the language changes
    if (!this.onLangChange) {
      this.onLangChange = translator.onLangChange.subscribe(
        (event: LangChangeEvent) => {
          if (this.lastKey) {
            this.lastKey = null; // we want to make sure it doesn't return the same value until it's been updated
            this.updateTranslation(query, translator, module);
          }
        },
      );
    }

    this.lastKey = query;

    // store the params, in case they change
    this.lastParams = args;

    this.updateTranslation(query, translator, module);
    return this.value;
  }

  private updateTranslation(
    query: string,
    translator: CustomTranslationService,
    module: string,
  ) {
    const onTranslation = (res: string) => {
      this.value = res !== undefined ? res : query;
      if (module != undefined && res == module + '.' + query) {
        this.value = query;
      }
      this.lastKey = query;
    };
    if (translator.currentLang == undefined) {
      translator.currentLang = translator.defaultLang;
    }
    translator
      .get((module ? module + '.' : '') + query)
      .subscribe(onTranslation);
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
  const t1 = typeof o1,
    t2 = typeof o2;
  let length: number, key: any, keySet: any;
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
