import {
  ChangeDetectorRef,
  DestroyRef,
  Injectable,
  Pipe,
  PipeTransform,
} from '@angular/core';
import {LangChangeEvent, TranslatePipe} from '@ngx-translate/core';
import {switchMap} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

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
    private destroyRef: DestroyRef,
  ) {
    super(translate2, _theRef);
  }

  transform(query: string, ...args: any[]) {
    if (query == undefined || query == '') {
      return query;
    }
    /**
     * Module parsing with temporal backwards compatibility for {module: <modulename>} arg
     * and new string annotation
     */
    const module = args[0]
      ? typeof args[0] === 'string'
        ? args[0]
        : args[0]['module']
      : '';

    // if (module && typeof module !== 'string') {
    //   throw new Error(
    //     `TranslateCustomPipe: Expected a string for module, but got ${typeof module}`,
    //   );
    // }

    const key = module ? `${module}.${query}` : query;
    if (key === this.lastKey) {
      return this.value;
    }

    const translator = this.hsLanguageService.getTranslator();

    // subscribe to onLangChange event, in case the language changes
    if (!this.onLangChange) {
      this.onLangChange = translator.onLangChange
        .pipe(
          switchMap((event: LangChangeEvent) => translator.get(key)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((translation: string) => {
          this.updateTranslation(translation, module, query);
        });
    }

    const translation = this.translate2.instant(key);
    this.updateTranslation(translation, module, query);

    this.lastKey = key;
    return this.value;
  }

  updateTranslation(translation: string, module: string, query: string) {
    this.value = translation;
    if (module != undefined && translation == `${module}.${query}`) {
      this.value = query;
    }
  }
}
