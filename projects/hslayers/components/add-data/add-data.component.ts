import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject, of, switchMap, takeUntil} from 'rxjs';

import {AddDataUrlType} from 'hslayers-ng/types';
import {DatasetType} from 'hslayers-ng/types';
import {
  HsAddDataCatalogueService,
  HsAddDataService,
} from 'hslayers-ng/shared/add-data';
import {HsAddDataUrlService} from 'hslayers-ng/shared/add-data';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsGetCapabilitiesErrorComponent} from './common/capabilities-error-dialog/capabilities-error-dialog.component';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsRemoveLayerDialogService} from 'hslayers-ng/common/remove-multiple';
import {HsShareUrlService} from 'hslayers-ng/components/share';
import {servicesSupportedByUrl} from 'hslayers-ng/types';

@Component({
  selector: 'hs-add-data',
  templateUrl: './add-data.component.html',
})
export class HsAddDataComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy {
  private end = new Subject<void>();

  layersAvailable: Observable<boolean>;
  constructor(
    public hsAddDataService: HsAddDataService,
    public hsShareUrlService: HsShareUrlService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataUrlService: HsAddDataUrlService,
    private hsDialogContainerService: HsDialogContainerService,
    public hsAddDataCatalogueService: HsAddDataCatalogueService,
    private hsRemoveLayerDialogService: HsRemoveLayerDialogService,
    private hsLaymanService: HsLaymanService,
  ) {
    super(hsLayoutService);
    this.layersAvailable =
      this.hsAddDataCatalogueService.addDataCatalogueLoaded.pipe(
        switchMap(() => {
          return of(this.hsAddDataCatalogueService.catalogEntries.length > 0);
        }),
      );
  }
  name = 'addData';

  selectDatasetType(type: DatasetType): void {
    this.hsAddDataService.selectType(type);
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.selectDatasetType('catalogue');

    servicesSupportedByUrl.forEach((type) =>
      this.connectServiceFromUrlParam(type as AddDataUrlType),
    );

    this.hsAddDataUrlService.addDataCapsParsingError
      .pipe(takeUntil(this.end))
      .subscribe((e) => {
        let error = e.toString();
        if (error?.includes('Unsuccessful OAuth2')) {
          error = 'COMMON.Authentication failed. Login to the catalogue.';
        } else if (error.includes('property')) {
          error = 'ADDLAYERS.serviceTypeNotMatching';
        } else {
          error = `ADDLAYERS.${error}`;
        }
        this.hsDialogContainerService.create(HsGetCapabilitiesErrorComponent, {
          error: error,
        });
      });
    super.ngOnInit();
  }

  connectServiceFromUrlParam(type: AddDataUrlType): void {
    const url = this.hsShareUrlService.getParamValue(`hs-${type}-to-connect`);
    if (url) {
      this.hsLayoutService.setMainPanel('addData');
      this.selectDatasetType('url');
      this.hsAddDataUrlService.typeSelected = type;
    }
  }

  /**
   * Create remove-layer dialog which allows for single/multiple layer removal
   */
  async removeMultipleLayers() {
    const confirmed =
      await this.hsRemoveLayerDialogService.removeMultipleLayers(
        this.hsAddDataCatalogueService.catalogEntries
          .filter((layer) => layer.editable)
          .map((l) => {
            return l.name;
          }),
        ['catalogue'],
      );
    if (confirmed) {
      this.hsAddDataCatalogueService.reloadData();
    }
  }

  /**
   * Remove all user's layers from Layman catalogue
   */
  async removeAllLayers() {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: 'LAYERMANAGER.dialogRemoveAll.dialogMessage',
        note: 'DRAW.deleteNotePlural',
        title: 'LAYERMANAGER.dialogRemoveAll.removeAllCatalogueLayers',
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed === 'yes') {
      await this.hsLaymanService.removeLayer();
      this.hsAddDataCatalogueService.reloadData();
    }
  }
}
