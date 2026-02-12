import {Component, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {
  HsOverlayConstructorService,
  HsPanelConstructorService,
} from 'hslayers-ng/services/panel-constructor';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';
import {HsProxyService} from 'hslayers-ng/services/utils';

import {createDefaultLayers} from './default-layers';
import {PopupWidgetComponent} from './popup-widget.component';
import {SomeComponent} from './some-panel/some-panel.component';
import {symbolizerIcons} from './symbolizer-icons';
import {Tile} from 'ol/layer';
import {OSM} from 'ol/source';
/**
 * Boolean flag to control whether to include default layers in the app.
 */
const WITH_LAYERS = true;

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: ['./hslayers-app.component.scss'],
  standalone: false,
})
export class HslayersAppComponent {
  hsConfig = inject(HsConfig);
  private hsProxyService = inject(HsProxyService);
  private hsEventBusService = inject(HsEventBusService);
  private httpClient = inject(HttpClient);
  hsSidebarService = inject(HsSidebarService);
  hsPanelConstructorService = inject(HsPanelConstructorService);
  hsLayoutService = inject(HsLayoutService);
  private hsOverlayConstructorService = inject(HsOverlayConstructorService);

  constructor() {
    this.hsPanelConstructorService.createPanelAndButton(
      SomeComponent,
      {
        panel: 'custom',
        module: 'some',
        order: 0,
        title: 'Custom panel',
        description: 'Custom panel with some fancy features',
        icon: 'fa-truck-fast',
      },
      {},
    );

    const defaultLayersResult = WITH_LAYERS
      ? createDefaultLayers({
          httpClient: this.httpClient,
          hsProxyService: this.hsProxyService,
        })
      : null;

    this.hsConfig.update({
      panelsEnabled: {
        draw: true,
        mapSwipe: true,
        language: true,
        tripPlanner: true,
      },
      componentsEnabled: {
        basemapGallery: true,
        mapSwipe: false,
      },
      sidebarPosition: 'right',
      //defaultComposition:
      //'https://atlas2.kraj-lbc.cz/rest/workspaces/fzadrazil/maps/lesni_plochy',*/
      panelWidths: {
        custom: 555,
        print: 500,
      },
      open_lm_after_comp_loaded: false,
      queryPopupWidgets: [
        'analysis',
        'layer-name',
        'feature-info',
        'clear-layer',
      ],
      customQueryPopupWidgets: [
        {name: 'analysis', component: PopupWidgetComponent},
      ],
      datasources: [
        {
          title: 'Layman',
          url: 'http://localhost:8087',
          type: 'layman',
        },
        {
          title: 'Micka',
          url: 'https://hub4everybody.com/micka/csw',
          language: 'eng',
          type: 'micka',
        },
      ],
      proxyPrefix: window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//127.0.0.1:8085/`
        : '/proxy/',
      mapSwipeOptions: {
        orientation: 'vertical',
      },
      ...(defaultLayersResult && {
        default_layers: defaultLayersResult.defaultLayers,
        layersInFeatureTable: defaultLayersResult.layersInFeatureTable,
      }),
      default_layers: [
        new Tile({
          source: new OSM(),
          visible: true,
          properties: {
            title: 'OpenStreet Map',
            base: true,
            removable: false,
          },
        }),
        ...(defaultLayersResult?.defaultLayers || []),
      ],
      layersInFeatureTable: defaultLayersResult?.layersInFeatureTable || [],
      enabledLanguages: 'sk, cs, en, la',
      language: 'en',
      assetsPath: 'assets',
      saveMapStateOnReload: false,
      toastAnchor: 'screen',
      symbolizerIcons: symbolizerIcons,
      shareServiceUrl: 'http://localhost:8086',
      popUpDisplay: 'hover',
      errorToastDuration: 5000,
      timeDisplayFormat: 'dd.MM.yyyy.',
      additionalLanguages: {
        la: 'Lingua Latina',
      },
      translationOverrides: {
        lv: {
          LAYERS: {
            'Latvian municipalities (1 sub-layer)':
              'Latvijas novadi (1 apakšslānis)',
          },
        },
        cs: {
          'My Cool Panel': 'Můj úžasný panel',
        },
        sk: {
          'My Cool Panel': 'Môj úžasný panel',
        },
        la: {
          'My Cool Panel': 'Mea tabula magna',
        },
      },
      defaultPanel: 'custom',
    });

    defaultLayersResult?.notifyOpticalMapDimensions?.((layer) =>
      this.hsEventBusService.layerDimensionDefinitionChanges.next(layer),
    );

    this.hsPanelConstructorService.createActivePanels();
    this.hsOverlayConstructorService.createGuiOverlay();
  }

  title = 'hslayers-workspace';
}
