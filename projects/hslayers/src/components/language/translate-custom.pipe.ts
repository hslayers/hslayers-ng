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
  implements PipeTransform
{
  onLangChangeOverridden: boolean;
  constructor(
    private translate2: TranslateService,
    private _theRef: ChangeDetectorRef,
    private hsLanguageService: HsLanguageService
  ) {
    super(translate2, _theRef);
  }

  transform(query: string, ...args: any[]) {
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
    const onTranslation = (res: string) => {
      this.value = res !== undefined ? res : query;
      this.lastKey = query;
    };
    this.hsLanguageService.apps[interpolateParams.app].translationService
      .get(query)
      .subscribe(onTranslation);
    return this.value;
  }
}
