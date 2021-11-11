import {Component} from '@angular/core';

import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import {OSM, Vector as VectorSource, XYZ} from 'ol/source';
import {Tile} from 'ol/layer';
import {Vector as VectorLayer} from 'ol/layer';

import vidzeme from '../assets/vidzeme.json';
import {
  HsConfig,
  HsEventBusService,
  HsLayoutService,
  HsQueryComponent,
  HsQueryPopupComponent,
  HsQueryPopupService,
  HsSearchToolbarComponent,
  HsToolbarPanelContainerService,
} from 'hslayers-ng';
import {HsStatisticsPanelComponent} from '../lib/statistics-panel.component';
import {HsStatisticsUploadPanelComponent} from '../lib/upload-panel';

@Component({
  selector: 'hslayers-app',
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class HslayersAppComponent {
  constructor(
    public HsConfig: HsConfig,
    private HsEventBusService: HsEventBusService,
    hsLayoutService: HsLayoutService,
    hsQueryPopupService: HsQueryPopupService,
    hsToolbarPanelContainerService: HsToolbarPanelContainerService
  ) {
    this.HsConfig.update({
      datasources: [
        {
          title: 'Layman',
          url: 'http://localhost:8087',
          user: 'anonymous',
          type: 'layman',
          liferayProtocol: 'https',
        },
      ],
      proxyPrefix: window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//${window.location.hostname}:8085/`
        : '/proxy/',
      panelsEnabled: {
        tripPlanner: true,
        info: true,
        compositionLoadingProgress: true,
      },
      componentsEnabled: {
        geolocationButton: true,
        guiOverlay: true,
      },
      assetsPath: 'assets',
      symbolizerIcons: [
        {name: 'bag', url: '/assets/icons/bag1.svg'},
        {name: 'banking', url: '/assets/icons/banking4.svg'},
        {name: 'bar', url: '/assets/icons/bar.svg'},
        {name: 'beach', url: '/assets/icons/beach17.svg'},
        {name: 'bicycles', url: '/assets/icons/bicycles.svg'},
        {name: 'building', url: '/assets/icons/building103.svg'},
        {name: 'bus', url: '/assets/icons/bus4.svg'},
      ],
      popUpDisplay: 'hover',
      default_layers: [
        new Tile({
          source: new OSM(),
          visible: true,
          properties: {
            title: 'OpenStreetMap',
            base: true,
            removable: false,
          },
        }),
        new VectorLayer({
          properties: {
            title: 'Municipalities',
            synchronize: false,
            cluster: false,
            inlineLegend: true,
            popUp: {
              attributes: ['LABEL'],
            },
            editor: {
              editable: true,
              defaultAttributes: {
                name: 'New polygon',
                description: 'none',
              },
            },
            sld: `<?xml version="1.0" encoding="ISO-8859-1"?>
            <StyledLayerDescriptor version="1.0.0" 
                xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
                xmlns="http://www.opengis.net/sld" 
                xmlns:ogc="http://www.opengis.net/ogc" 
                xmlns:xlink="http://www.w3.org/1999/xlink" 
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
              <NamedLayer>
                <Name>Simple point with stroke</Name>
                <UserStyle>
                  <Title>Default</Title>
                  <FeatureTypeStyle>
                    <Rule>
                    <PolygonSymbolizer>
                    <Fill>
                      <CssParameter name="fill">#51a6d1</CssParameter>
                    </Fill>
                  </PolygonSymbolizer>
                    </Rule>
                  </FeatureTypeStyle>
                </UserStyle>
              </NamedLayer>
            </StyledLayerDescriptor>
            `,
            path: 'User generated',
          },
          source: new VectorSource({
            features: new GeoJSON().readFeatures(vidzeme, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }),
          }),
        }),
      ],
    });
    hsLayoutService.createPanel(HsQueryComponent, {});
    hsLayoutService.createPanel(HsStatisticsUploadPanelComponent, {});
    hsLayoutService.createPanel(HsStatisticsPanelComponent, {});
    hsToolbarPanelContainerService.create(HsSearchToolbarComponent, {});
    hsLayoutService.createOverlay(HsQueryPopupComponent, {
      service: hsQueryPopupService,
    });
  }
  title = 'hslayers-workspace';
}
