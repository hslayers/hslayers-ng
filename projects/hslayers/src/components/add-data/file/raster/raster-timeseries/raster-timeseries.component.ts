import {Component, Input, OnInit} from '@angular/core';

import {loadAsync} from 'jszip';

import {FileDataObject} from '../../types/file-data-object.type';
import {FileDescriptor} from '../../types/file-descriptor.type';

@Component({
  selector: 'hs-file-raster-timeseries',
  templateUrl: './raster-timeseries.component.html',
  styleUrls: ['./raster-timeseries.component.scss'],
})
export class RasterTimeseriesComponent implements OnInit {
  @Input() data: FileDataObject;

  tsData: FileDescriptor;
  fileTitle: string;

  selectedString: string;
  constructor() {}

  ngOnInit() {
    this.tsData = this.data.files[0];

    loadAsync(this.tsData.content).then((zip) => {
      // Get an array of filenames within the zip archive
      const filenames = Object.keys(zip.files);
      this.fileTitle = filenames[0];
    });
  }

  getSelectedString(e: MouseEvent) {
    e.preventDefault();
    const selection = window.getSelection();
    this.selectedString = selection.toString();

    this.inferRegexPatternFromString(this.selectedString);
  }

  /**
   * Get first special character from string selected by user
   * Assuming its separator
   */
  private getSpecialCharacters(input: string): string {
    const specialCharacters = input.match(/[._\/-]/g) || [];
    return specialCharacters[0];
  }

  /**
   *
   */
  inferRegexPatternFromString(timestamp: string): string {
    const specialCharacter = this.getSpecialCharacters(timestamp);

    if (specialCharacter) {
      let parts = timestamp.split(specialCharacter);
      parts = parts.map((part) => {
        return `[0-9]{${part.length}}`;
      });
      return parts.join('');
    }
  }
}
