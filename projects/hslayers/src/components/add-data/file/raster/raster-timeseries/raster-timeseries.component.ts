import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NgbAccordion} from '@ng-bootstrap/ng-bootstrap';

import {loadAsync} from 'jszip';

import {FileDataObject} from '../../types/file-data-object.type';
import {FileDescriptor} from '../../types/file-descriptor.type';
import {HsToastService} from '../../../../layout/toast/toast.service';

@Component({
  selector: 'hs-file-raster-timeseries',
  templateUrl: './raster-timeseries.component.html',
  styleUrls: ['./raster-timeseries.component.scss'],
})
export class RasterTimeseriesComponent implements OnInit {
  @Input() data: FileDataObject;
  @ViewChild('acc') accordionComponent: NgbAccordion;

  form: FormGroup;
  formVisible = false;

  tsData: FileDescriptor;
  fileTitle: string;

  selectedString: string;
  constructor(private fb: FormBuilder, private hsToastService: HsToastService) {
    this.form = this.fb.group({
      /* Regex string encoding of date patter used in file name  */
      regex: ['', Validators.required],
      /* Date format used in file name eg. YYYY.MM.DD  */
      format: ['yyyyMMdd', Validators.required],
      verified: [false, Validators.requiredTrue],
    });
  }

  ngOnInit() {
    this.tsData = this.data.files[0];

    loadAsync(this.tsData.content).then((zip) => {
      // Get an array of filenames within the zip archive
      const filenames = Object.keys(zip.files);
      this.fileTitle = filenames[0];
    });
  }

  /** On click handler used by user to mark infered inputs as verified */
  verifyInputs(): void {
    this.form.patchValue({verified: true});
    this.accordionComponent.expand('hs-timeseries-acc');
    this.data.timeRegex = `${this.form.controls.regex.value}`;
    this.data.format = `format=${this.form.controls.format.value}`;
    /**
     * TODO:
     * - If raster-ts active its neccessary for verified control to be true
     * to be able to 'Add' layer
     */
  }

  private checkStringValidity(): boolean {
    return (
      !/[a-zA-Z]/.test(this.selectedString) && this.selectedString.length > 0
    );
  }

  selectDateString(e: MouseEvent): void {
    e.preventDefault();
    //Reset verified control
    this.form.patchValue({verified: false});
    //Get selected string
    this.selectedString = this.getSelectedText();

    const isValid = this.checkStringValidity();
    if (isValid) {
      this.form.patchValue({
        regex: this.inferRegexPatternFromString(this.selectedString),
      });
      this.formVisible = true;
    } else {
      this.selectedString = undefined;
      this.formVisible = false;
      this.data.timeRegex = undefined;

      this.hsToastService.createToastPopupMessage(
        'Selected string is invalid',
        'Selected string is missing or contains alphabetical characters.',
        {
          toastStyleClasses: 'bg-danger text-light',
          customDelay: 7000,
        }
      );
    }
  }

  /**
   * Get first special character from string selected by user
   * Assuming its separator
   */
  private getSeparator(input: string): string {
    const separators = input.match(/[._\/-]/g) || [];
    return separators[0];
  }

  /**
   *Infer regex pattern from selected string
   */
  inferRegexPatternFromString(timestamp: string): string {
    const separator = this.getSeparator(timestamp);

    if (separator) {
      let parts = timestamp.split(separator);
      parts = parts.map((part) => `[0-9]{${part.length}}`);
      return parts.join(separator);
    } else {
      return `[0-9]{${this.selectedString.length}}`;
    }
  }

  /**
   * Extract selected text from element.
   * Necessarry workaround because of Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=85686
   */
  private getSelectedText(): string {
    const inputElement = document.getElementById(
      'hs-timeseries-title'
    ) as HTMLInputElement;
    return inputElement.value.substring(
      inputElement.selectionStart,
      inputElement.selectionEnd
    );
  }
}
