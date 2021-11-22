import {AfterViewInit, Component, ViewChild} from '@angular/core';

import Papa from 'papaparse';
import {
  HsConfig,
  HsDialogContainerService,
  HsLanguageService,
  HsLayoutService,
  HsPanelBaseComponent,
  HsSidebarService,
  HsUploadComponent,
  HsUploadedFiles,
} from 'hslayers-ng';

import {HsStatisticsService, Usage} from './statistics.service';
import {HsStatisticsToMapDialogComponent} from './to-map-dialog.component';

@Component({
  selector: 'hs-statistics-upload',
  templateUrl: './upload-panel.component.html',
})
export class HsStatisticsUploadPanelComponent
  extends HsPanelBaseComponent
  implements AfterViewInit
{
  public title = '';
  name = 'statistics-upload';
  columns: string[];
  uses: Usage;
  rows: any[];
  rowsCollapsed = false;
  fileInput;
  @ViewChild(HsUploadComponent) hsUploadComponent: HsUploadComponent;
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
    if (!this.rows && !this.columns) {
      const savedTable = localStorage.getItem('hs_statistics_table');
      if (savedTable) {
        this.rows = JSON.parse(savedTable).rows;
        this.columns = JSON.parse(savedTable).columns;
        this.setUses();
      }
    }
    this.hsStatisticsService.clearData$.subscribe(() => {
      this.rows = [];
      this.columns = [];
      this.uses = {};
      this.rowsCollapsed = false;
      if (this.fileInput?.nativeElement?.value) {
        this.fileInput.nativeElement.value = '';
      }
    });
  }
  ngAfterViewInit(): void {
    this.fileInput = this.hsUploadComponent.getFileInput();
  }

  visualizeInMap(): void {
    this.hsDialogContainerService.create(HsStatisticsToMapDialogComponent, {
      rows: this.rows,
      columns: this.columns,
      uses: this.uses,
    });
  }

  dataAvailable(): boolean {
    return this.columns?.length > 0 && this.rows?.length > 0;
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
      if (!fileContents) {
        console.error('Something went wrong');
        return;
      }
      const records = Papa.parse(fileContents[0] as string, {header: true});
      this.columns = Object.keys(records.data[0]);
      this.setUses();
      this.rows = records.data;
    });
  }

  setUses(): void {
    if (!this.columns) {
      return;
    }
    this.uses = {};
    this.columns.map((key) => {
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
  }
}
