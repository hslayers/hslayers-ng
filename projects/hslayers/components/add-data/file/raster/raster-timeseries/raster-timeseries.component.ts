import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NgbAccordionDirective} from '@ng-bootstrap/ng-bootstrap';

import {Subject} from 'rxjs';
import {loadAsync} from 'jszip';
import {takeUntil} from 'rxjs/operators';

import {FileDataObject} from '../../types/file-data-object.type';
import {FileDescriptor} from '../../types/file-descriptor.type';
import {HsAddDataCommonFileService} from '../../../common/common-file.service';
import {HsToastService} from 'hslayers-ng/components/layout';

@Component({
  selector: 'hs-file-raster-timeseries',
  templateUrl: './raster-timeseries.component.html',
  styleUrls: ['./raster-timeseries.component.scss'],
})
export class RasterTimeseriesComponent implements OnInit, OnDestroy {
  @Input() data: FileDataObject;

  @ViewChild('acc') accordion: NgbAccordionDirective;
  @ViewChild('hsTimeseriesTitle') fileTitleInput: ElementRef<HTMLInputElement>;

  private end = new Subject<void>();

  form: FormGroup;
  formVisible = false;

  tsData: FileDescriptor;
  fileTitle: string;

  selectedString: string;

  supportedRegex = [
    {
      regex: /^[0-9]{8}T([0-9]{6}([0-9]{3})?)(Z)?$/,
      timeregex: '[0-9]{8}T[0-9]{6}',
    },
    {
      regex: /^[0-9._/-]+(?<![a-zA-Z])$/,
      timeregex: undefined,
    },
  ];

  constructor(
    private fb: FormBuilder,
    private hsToastService: HsToastService,
    private hsAddDataCommonFileService: HsAddDataCommonFileService,
  ) {
    this.form = this.fb.group({
      /* Regex string encoding of date pattern used in file name  */
      regex: ['', Validators.required],
      verified: [false, Validators.requiredTrue],
    });
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit() {
    this.tsData = this.data.files[0];

    this.getFileTitle(this.tsData.content);

    this.hsAddDataCommonFileService.dataObjectChanged
      .pipe(takeUntil(this.end))
      .subscribe((data) => {
        if (data.files) {
          this.resetForm();
          this.data.srs = undefined;
          this.getFileTitle(data.files[0].content);
        }
      });
  }

  private getFileTitle(content: string | ArrayBuffer): void {
    loadAsync(content).then((zip) => {
      // Get an array of filenames within the zip archive
      const filenames = Object.keys(zip.files);
      this.fileTitle = filenames[0];
    });
  }

  /** On click handler used by user to mark inferred inputs as verified */
  verifyInputs(): void {
    this.form.patchValue({verified: true});
    this.accordion.collapse('hs-timeseries-acc');
    this.data.timeRegex = `${this.form.controls.regex.value}`;
  }

  /**
   * Checks the validity of the selected string
   * String is valid if:
   * - matches one of the following regex datetime formats
   *    -[0-9]\{8\}T[0-9]\{9\}Z eg 20220510T050948Z
   *    -[0-9]\{8\}T[0-9]\{9\} eg. 20220510T050948
   * - consist of digits only or digits and separators  ., _, /, or -
   */
  private checkStringValidity(): string | undefined {
    return this.supportedRegex
      .map((val) => val.regex)
      .find((r: RegExp) => {
        return r.test(this.selectedString);
      })?.source;
  }

  selectDateString(e: MouseEvent): void {
    e.preventDefault();
    //Reset verified control and data value (it's added on verify to control form submission)
    this.form.patchValue({verified: false});
    this.data.timeRegex = undefined;
    //Get selected string
    this.selectedString = this.getSelectedText();

    const isValid = this.checkStringValidity();
    if (isValid) {
      this.form.patchValue({
        regex: this.inferRegexPatternFromString(this.selectedString, isValid),
      });
      this.formVisible = true;
    } else {
      this.resetForm();

      this.hsToastService.createToastPopupMessage(
        'Selected string is invalid',
        'Selected string is missing or is not supported.',
        {
          toastStyleClasses: 'bg-danger text-light',
          customDelay: 7000,
        },
      );
    }
  }

  /**
   * Get first special character from string selected by user
   * Assuming it's separator
   */
  private getSeparator(input: string): string {
    const separators = input.match(/[._\/-]/g) || [];
    return separators[0];
  }

  /**
   *Infer regex pattern from selected string
   */
  inferRegexPatternFromString(timestamp: string, regex: string): string {
    if (regex !== '^[0-9._/-]+(?<![a-zA-Z])$') {
      const match = timestamp.match(regex);
      const hasMs = match[1].length == 9;
      let timeregex = this.supportedRegex[0].timeregex;
      //has Z postfix
      if (match[3]) {
        //If milliseconds are included in timestamp ignore them
        timeregex = hasMs ? `(${timeregex})${match[2]}(Z)` : `${timeregex}Z`;
      }
      //timeregex alone would work but in UI its a bit more clear that
      //only first 6 time digits are used
      return hasMs ? `(${timeregex})${match[2]}` : timeregex;
    }
    const separator = this.getSeparator(timestamp);
    if (separator) {
      let parts = timestamp.split(separator);
      parts = parts.map((part) => `([0-9]{${part.length}})`);
      return parts.join(separator);
    } else {
      return `[0-9]{${this.selectedString.length}}`;
    }
  }

  /**
   * Extract selected text from element.
   * Necessary workaround because of Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=85686
   */
  private getSelectedText(): string {
    const inputElement = this.fileTitleInput.nativeElement;
    return inputElement.value.substring(
      inputElement.selectionStart,
      inputElement.selectionEnd,
    );
  }

  private resetSelection(): void {
    const inputElement = this.fileTitleInput.nativeElement;
    inputElement.selectionStart = undefined;
    inputElement.selectionEnd = undefined;
  }

  /**
   * Reset form controls to default values
   */
  private resetForm(): void {
    this.selectedString = undefined;
    this.formVisible = false;
    this.data.timeRegex = undefined;
    this.form.patchValue({verified: false});
    this.resetSelection();
  }
}
