import {DestroyRef} from '@angular/core';
import {EMPTY, NEVER, pipe, takeUntil, MonoTypeOperatorFunction} from 'rxjs';
import {catchError, defaultIfEmpty} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

/**
 * A safer version of takeUntilDestroyed that handles edge cases around component destruction.
 * Based on: https://github.com/angular/angular/issues/54527#issuecomment-2098254508
 */
export function safeTakeUntilDestroyed<T>(
  destroyRef?: DestroyRef,
): MonoTypeOperatorFunction<T> {
  return pipe(
    takeUntil(
      // NEVER is an observable that never emits any value
      NEVER.pipe(
        // When component is destroyed, takeUntilDestroyed will complete the NEVER observable
        takeUntilDestroyed(destroyRef),
        // If takeUntilDestroyed throws (e.g., "View destroyed" error),
        // we catch it and return EMPTY to safely complete
        catchError(() => EMPTY),
        // Since NEVER never emits, we provide a default value when it completes
        // This ensures the takeUntil always gets a value to complete with
        defaultIfEmpty(null),
      ),
    ),
  );
}
