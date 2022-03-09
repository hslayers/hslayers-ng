import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import dayjs from 'dayjs';
import {Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {Geometry, MultiPolygon} from 'ol/geom';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Vector as VectorSource} from 'ol/source';
import {WKT} from 'ol/format';
import {getWidth} from 'ol/extent';

import {
  HsConfig,
  HsLanguageService,
  HsSidebarService,
  getFeatureName,
  getUnitId,
  setFeatureName,
  setUnitId,
} from 'hslayers-ng';
import {HsDialogContainerService} from 'hslayers-ng';
import {HsEventBusService} from 'hslayers-ng';
import {HsLayoutService} from 'hslayers-ng';
import {HsMapService} from 'hslayers-ng';
import {HsUtilsService} from 'hslayers-ng';

import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {SensLogEndpoint} from './senslog-endpoint';

@Injectable({
  providedIn: 'root',
})
export class HsSensorsService {
  labelStyle = new Style({
    geometry: function (feature) {
      let geometry = feature.getGeometry();
      if (geometry.getType() == 'MultiPolygon') {
        // Only render label for the widest polygon of a multipolygon
        const polygons = (geometry as MultiPolygon).getPolygons();
        let widest = 0;
        for (let i = 0, ii = polygons.length; i < ii; ++i) {
          const polygon = polygons[i];
          const width = getWidth(polygon.getExtent());
          if (width > widest) {
            widest = width;
            geometry = polygon;
          }
        }
      }
      return geometry;
    },
    text: new Text({
      font: '12px Calibri,sans-serif',
      overflow: true,
      fill: new Fill({
        color: '#000',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 3,
      }),
    }),
  });

  bookmarkStyle = null;
  units: any = [];
  layer = null;
  endpoint: SensLogEndpoint;

  constructor(
    public HsUtilsService: HsUtilsService,
    public HsConfig: HsConfig,
    public HsMapService: HsMapService,
    public HsLayoutService: HsLayoutService,
    public HsDialogContainerService: HsDialogContainerService,
    private http: HttpClient,
    public HsEventBusService: HsEventBusService,
    public HsSensorsUnitDialogService: HsSensorsUnitDialogService,
    private HsSidebarService: HsSidebarService,
    private HsLanguageService: HsLanguageService
  ) {
    this.HsSidebarService.buttons.push({
      panel: 'sensors',
      module: 'hs.sensors',
      order: 6,
      fits: true,
      title: () =>
        this.HsLanguageService.getTranslation('PANEL_HEADER.SENSORS'),
      description: '',
      icon: 'icon-weightscale',
    });
    this.setEndpoint();
    this.HsConfig.get(app).configChanges.subscribe(() => {
      if (this.HsConfig.get(app).senslog != this.endpoint) {
        this.setEndpoint();
      }
    });

    this.HsEventBusService.vectorQueryFeatureSelection.subscribe((event) => {
      HsUtilsService.debounce(
        () => {
          if (
            this.HsMapService.getLayerForFeature(event.feature) == this.layer
          ) {
            HsLayoutService.setMainPanel('sensors');
            this.units.forEach((unit: HsSensorUnit) => (unit.expanded = false));
            this.selectUnit(
              this.units.filter(
                (unit: HsSensorUnit) => unit.unit_id == getUnitId(event.feature)
              )[0]
            );
          }
        },
        150,
        false,
        this
      );
    });
  }

  private setEndpoint() {
    if (this.HsConfig.get(app).senslog) {
      this.endpoint = this.HsConfig.get(app).senslog;
      if (this.endpoint.liteApiPath == undefined) {
        this.endpoint.liteApiPath = 'senslog-lite2';
      }
      this.HsSensorsUnitDialogService.endpoint = this.endpoint;
    }
  }

  selectSensor(sensor): void {
    this.HsSensorsUnitDialogService.selectSensor(sensor);
    sensor.checked = true;
  }

  selectUnit(unit: HsSensorUnit): void {
    this.HsSensorsUnitDialogService.unit = unit;
    unit.expanded = !unit.expanded;
    //this.selectSensor(unit.sensors[0]);
    if (
      !this.HsLayoutService.contentWrapper.querySelector(
        '.hs-sensor-unit-dialog'
      )
    ) {
      this.HsDialogContainerService.create(HsSensorsUnitDialogComponent, {});
    } else {
      this.HsSensorsUnitDialogService.unitDialogVisible = true;
    }
    if (this.HsSensorsUnitDialogService.currentInterval == undefined) {
      this.HsSensorsUnitDialogService.currentInterval = {
        amount: 1,
        unit: 'days',
      };
    }
    this.HsSensorsUnitDialogService.getObservationHistory(
      unit,
      this.HsSensorsUnitDialogService.currentInterval
    ).then((_) => this.HsSensorsUnitDialogService.createChart(unit));
    this.HsMapService.getMap(app)
      .getView()
      .fit(unit.feature.getGeometry(), {maxZoom: 16});
  }

  createLayer() {
    const me = this;
    this.bookmarkStyle = [
      new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#e49905',
          width: 2,
        }),
        image: new Icon({
          src: this.HsUtilsService.getAssetsPath() + 'img/icons/wifi8.svg',
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
      }),
      this.labelStyle,
    ];
    this.layer = new VectorLayer<VectorSource<Geometry>>({
      properties: {
        title: 'Sensor units',
        editor: {
          editable: false,
        },
      },
      style: function (feature: Feature<Geometry>) {
        me.labelStyle.getText().setText(getFeatureName(feature));
        return me.bookmarkStyle;
      },
      source: new VectorSource({}),
    });
    this.HsMapService.getMap(app).addLayer(this.layer);
  }

  /**
   * Get list of units from Senslog backend
   */
  getUnits() {
    if (this.layer === null) {
      this.createLayer();
    }
    const url = this.HsUtilsService.proxify(
      `${this.endpoint.url}/${this.endpoint.liteApiPath}/rest/unit`
    );
    this.http
      .get(url, {
        params: {
          user_id: this.endpoint.user_id.toString(),
        },
      })
      .subscribe((response) => {
        this.units = response;
        this.layer.getSource().clear();
        const features = this.units
          .filter(
            (unit: HsSensorUnit) =>
              unit.unit_position && unit.unit_position.asWKT
          )
          .map((unit: HsSensorUnit) => {
            const format = new WKT();
            const feature = format.readFeature(unit.unit_position.asWKT, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            });
            setFeatureName(feature, unit.description);
            setUnitId(feature, unit.unit_id);
            unit.feature = feature;
            return feature;
          });
        this.layer.getSource().addFeatures(features);
        this.fillLastObservations();
        this.units.forEach((unit: HsSensorUnit) => {
          unit.sensorTypes = unit.sensors.map((s) => {
            return {name: s.sensor_type};
          });
          unit.sensors.sort((a, b) => {
            return b.sensor_id - a.sensor_id;
          });
          unit.sensorTypes = this.HsUtilsService.removeDuplicates(
            unit.sensorTypes,
            'name'
          );
          unit.sensorTypes.map(
            (st) =>
              (st.sensors = unit.sensors.filter(
                (s) => s.sensor_type == st.name
              ))
          );
        });
        setInterval(() => this.fillLastObservations(), 60000);
      });
  }

  filterquery(sensors, query) {
    return sensors.filter(
      (s) =>
        query.description == '' ||
        s.description.toLowerCase().indexOf(query.description.toLowerCase()) >
          -1
    );
  }

  fillLastObservations(): void {
    this.http
      .get(
        this.HsUtilsService.proxify(
          `${this.endpoint.url}/senslog1/SensorService`
        ),
        {
          params: {
            Operation: 'GetLastObservations',
            group: this.endpoint.group,
            user: this.endpoint.user,
          },
        }
      )
      .subscribe((response: any) => {
        const sensorValues = {};
        response.forEach((sv) => {
          sensorValues[sv.sensorId] = {
            value: sv.observedValue,
            timestamp: dayjs(sv.timeStamp).format('DD.MM.YYYY HH:mm'),
          };
        });
        this.units.forEach((unit: HsSensorUnit) => {
          unit.sensors.forEach((sensor) => {
            this.HsSensorsUnitDialogService.sensorById[sensor.sensor_id] =
              sensor;
            if (sensorValues[sensor.sensor_id]) {
              sensor.lastObservationValue =
                sensorValues[sensor.sensor_id].value;
              sensor.lastObservationTimestamp =
                sensorValues[sensor.sensor_id].timestamp;
            }
          });
        });
      });
  }
}
