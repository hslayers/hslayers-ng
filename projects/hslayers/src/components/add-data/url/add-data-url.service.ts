import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsGetCapabilitiesErrorComponent} from '../common/capabilities-error-dialog.component';
import {HsLanguageService} from '../../language/language.service';
import {HsLogService} from '../../../common/log/log.service';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataUrlService {
  addDataCapsParsingError: Subject<{e: any; context: any;}>  =  new Subject();

  constructor(
    public hsLog: HsLogService,
    public HsLanguageService: HsLanguageService,
    public HsDialogContainerService: HsDialogContainerService
  ) {
    this.addDataCapsParsingError.subscribe((e) => {
      this.hsLog.warn(e);

      let error = e.toString();
      if (error.includes('property')) {
        error = this.HsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS',
          'serviceTypeNotMatching'
        );
      }
      this.HsDialogContainerService.create(
        HsGetCapabilitiesErrorComponent,
        error
      );
    });
  }
}
