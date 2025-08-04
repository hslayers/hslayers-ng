import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

@Injectable()
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false, // required to update the value when the promise is resolved
})
export class TranslateCustomPipe
  extends TranslatePipe
  implements PipeTransform {}
