import {Component} from '@angular/core';

import Papa from 'papaparse';
import {
  HsConfig,
  HsDialogContainerService,
  HsLanguageService,
  HsLayoutService,
  HsPanelBaseComponent,
  HsSidebarService,
  HsUploadedFiles,
} from 'hslayers-ng';
import {HsStatisticsService, Usage} from './statistics.service';
import {HsStatisticsToMapDialogComponent} from './to-map-dialog.component';

@Component({
  selector: 'hs-statistics-upload',
  templateUrl: './upload-panel.component.html',
})
export class HsStatisticsUploadPanelComponent extends HsPanelBaseComponent {
  public title = '';
  name = 'statistics-upload';
  columns: string[];
  uses: Usage;
  rows: any[];

  constructor(
    public hsStatisticsService: HsStatisticsService,
    public hsConfig: HsConfig,
    hsLayoutService: HsLayoutService,
    hsLanguageService: HsLanguageService,
    hsSidebarService: HsSidebarService,
    private hsDialogContainerService: HsDialogContainerService
  ) {
    super(hsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'statistics-upload',
      module: 'hs.statistics-upload',
      order: 10,
      fits: true,
      title: () => hsLanguageService.getTranslation('PANEL_HEADER.UPLOAD'),
      description: () =>
        hsLanguageService.getTranslation('SIDEBAR.descriptions.UPLOAD'),
      icon: 'icon-upload',
    });
  }

  visualizeInMap(): void {
    this.hsDialogContainerService.create(HsStatisticsToMapDialogComponent, {
      rows: this.rows,
      columns: this.columns,
      uses: this.uses,
    });
  }

  handleFileUpload(evt: HsUploadedFiles): void {
    const files = Array.from(evt.fileList);
    const promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsText(file);
      });
    });
    Promise.all(promises).then(async (fileContents) => {
      const records = Papa.parse(fileContents[0] as string, {header: true});
      this.columns = Object.keys(records.data[0]);
      this.uses = {};
      Object.keys(records.data[0]).map((key) => {
        switch (key) {
          case 'Novads':
          case 'Pagasts':
          case 'Pašvaldība':
            this.uses[key] = 'location';
            break;
          case 'Gads':
            this.uses[key] = 'time';
            break;
          default:
            this.uses[key] = 'variable';
        }
      });
      this.rows = records.data;
    });
  }
}
