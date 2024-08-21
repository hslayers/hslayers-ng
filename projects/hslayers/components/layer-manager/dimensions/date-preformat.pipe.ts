import {Pipe, PipeTransform} from '@angular/core';

/**
 * Formats a shorthand date in a form YYYYMMDD into a full ISO form YYYY-MM-DD
 * If not used, the shorthand date is parsed as milliseconds in the DatePipe
 */
@Pipe({
  name: 'datePreformat',
  standalone: true,
})
export class DatePreformatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value.includes('-') && value.length === 8) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
    return value;
  }
}
