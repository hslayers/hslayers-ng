import {Injectable} from '@angular/core';
import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
} from '@ngx-translate/core';

/**
 * This service handles cases where translation keys are missing from the translation files.
 * It provides fallback behavior by:
 * - Returning the fallbackValue if provided in the interpolation parameters
 * - Logging missing translations for debugging purposes
 * - Returning the translation key as a fallback when no fallbackValue is available
 */
@Injectable({
  providedIn: 'root',
})
export class HsMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    // If the fallbackValue is provided, return it
    if (params.interpolateParams?.hasOwnProperty('fallbackValue')) {
      return (params.interpolateParams as any).fallbackValue;
    }

    // Return last part of the key (SIDNENAV.PANEL.Info -> Info) or the key itself if single part key
    return String(params.key).split('.').pop();
  }
}
