import * as merge from 'deepmerge';
import en from '../../assets/locales/en.json';
import {
  FakeMissingTranslationHandler,
  TranslateDefaultParser,
  TranslateFakeCompiler,
  TranslateLoader,
  TranslateService,
} from '@ngx-translate/core';
import {HsConfig} from '../../config.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, forkJoin, from, lastValueFrom, map} from 'rxjs';

export class WebpackTranslateLoader implements TranslateLoader {
  loaded = {};
  constructor(public HsConfig: HsConfig, private HttpClient: HttpClient) {}

  /**
   *
   * @param lang - language code for each app in format `language` such as `en`
   * @returns
   */
  getTranslation(lang: string): any {
    //Idea taken from https://github.com/denniske/ngx-translate-multi-http-loader/blob/master/projects/ngx-translate/multi-http-loader/src/lib/multi-http-loader.ts
    const requests: Observable<any>[] = [
      //these translations are loaded as promises in order, where next one overwrites previous loaders values
      from(new Promise((resolve) => resolve(en))),
      from(
        new Promise(async (resolve) => {
          (async () => {
            if (this.HsConfig.assetsPath == undefined) {
              console.warn('HsConfig.assetsPath not set. Waiting...'); //HsConfig won't be updated yet if HsCore is included in AppComponent
              let counter = 0;
              const MAX_CONFIG_POLLS = 10;
              while (
                !this.HsConfig.assetsPath &&
                counter++ < MAX_CONFIG_POLLS
              ) {
                await new Promise((resolve2) => setTimeout(resolve2, 100));
              }
              if (counter >= MAX_CONFIG_POLLS) {
                resolve(en); //This is needed to display English if assetsPath will never be set.
                if (lang != 'en') {
                  console.error(
                    'Please set HsConfig.apps[default].assetsPath so translations can be loaded'
                  );
                }
                return;
              }
              console.log('assetsPath OK');
            }
            const res = await lastValueFrom(
              this.HttpClient.get(
                `${this.HsConfig.assetsPath}/locales/${lang}.json`
              )
            );
            this.loaded[lang] = true;
            resolve(res);
          })();
        })
      ),
      from(
        new Promise((resolve) => {
          //Wait a bit for the HsConfig to be set from container app
          setTimeout((_) => {
            if (
              this.HsConfig.translationOverrides &&
              this.HsConfig.translationOverrides[lang]
            ) {
              resolve(this.HsConfig.translationOverrides[lang]);
            } else {
              resolve({});
            }
          }, 200);
        })
      ),
    ];
    const tmp = forkJoin(requests).pipe(
      map((response) => {
        return merge.all(response);
      })
    );
    return tmp;
  }
}

@Injectable({
  providedIn: 'root',
})
export class CustomTranslationService extends TranslateService {
  constructor(HsConfig: HsConfig, HttpClient: HttpClient) {
    super(
      null,
      new WebpackTranslateLoader(HsConfig, HttpClient),
      new TranslateFakeCompiler(),
      new TranslateDefaultParser(),
      new FakeMissingTranslationHandler(),
      false,
      true,
      false,
      null
    );
  }
}
