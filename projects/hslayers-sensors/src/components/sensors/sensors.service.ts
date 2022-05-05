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
import {SensLogEndpoint} from './types/senslog-endpoint.type';

class SensorsServiceParams {
  bookmarkStyle = null;
  units: any = [];
  layer = null;
  endpoint: SensLogEndpoint;
  labelStyle: Style;
}
@Injectable({
  providedIn: 'root',
})
export class HsSensorsService {
  olStyle = new Style({
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

  apps: {
    [id: string]: SensorsServiceParams;
  } = {default: new SensorsServiceParams()};

  constructor(
    private hsUtilsService: HsUtilsService,
    private hsConfig: HsConfig,
    private hsMapService: HsMapService,
    private hsLayoutService: HsLayoutService,
    private hsDialogContainerService: HsDialogContainerService,
    private http: HttpClient,
    private hsEventBusService: HsEventBusService,
    private hsSensorsUnitDialogService: HsSensorsUnitDialogService,
    private hsSidebarService: HsSidebarService,
    private hsLanguageService: HsLanguageService
  ) {
    this.hsSidebarService.addButton({
      panel: 'sensors',
      module: 'hs.sensors',
      order: 6,
      fits: true,
      title: () =>
        this.hsLanguageService.getTranslation('PANEL_HEADER.SENSORS'),
      description: '',
      icon: 'icon-weightscale',
    });
  }

  /**
   * Initialize sensors service data and subscribers
   * @param app - App identifier
   */
  init(app: string): void {
    const appRef = this.get(app);
    appRef.labelStyle = this.olStyle;
    this.hsConfig.configChanges.subscribe(() => {
      if (this.hsConfig.get(app).senslog != appRef.endpoint) {
        this.setEndpoint(app);
      }
    });
    this.setEndpoint(app);

    this.hsEventBusService.vectorQueryFeatureSelection.subscribe((event) => {
      this.hsUtilsService.debounce(
        () => {
          if (
            this.hsMapService.getLayerForFeature(event.feature, app) ==
            appRef.layer
          ) {
            this.hsLayoutService.setMainPanel('sensors', app);
            appRef.units.forEach(
              (unit: HsSensorUnit) => (unit.expanded = false)
            );
            this.selectUnit(
              appRef.units.filter(
                (unit: HsSensorUnit) => unit.unit_id == getUnitId(event.feature)
              )[0],
              app
            );
          }
        },
        150,
        false,
        this
      )();
    });
  }

  /**
   * Set endpoint for sensors service to receive data from senslog
   * @param app - App identifier
   */
  private setEndpoint(app: string) {
    const appRef = this.get(app);
    if (this.hsConfig.get(app).senslog) {
      appRef.endpoint = this.hsConfig.get(app).senslog;
      if (appRef.endpoint.liteApiPath == undefined) {
        appRef.endpoint.liteApiPath = 'senslog-lite2';
      }
      if (appRef.endpoint.senslog1Path == undefined) {
        appRef.endpoint.senslog1Path = 'senslog1';
      }
      this.hsSensorsUnitDialogService.get(app).endpoint = appRef.endpoint;
    }
  }

  /**
   * Get the params saved by the sensors service for the current app
   * @param app - App identifier
   */
  get(app: string): SensorsServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new SensorsServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Select sensor from available sensors
   * @param sensor - Sensor selected
   * @param app - App identifier
   */
  selectSensor(sensor, app: string): void {
    this.hsSensorsUnitDialogService.selectSensor(sensor, app);
    sensor.checked = true;
  }

  /**
   * Select unit from available Units
   * @param unit - Unit selected
   * @param app - App identifier
   */
  selectUnit(unit: HsSensorUnit, app: string): void {
    this.hsSensorsUnitDialogService.get(app).unit = unit;
    unit.expanded = !unit.expanded;
    //this.selectSensor(unit.sensors[0]);
    if (
      !this.hsDialogContainerService
        .get(app)
        .dialogs.some((d) =>
          this.hsUtilsService.instOf(d, HsSensorsUnitDialogComponent)
        )
    ) {
      this.hsDialogContainerService.create(
        HsSensorsUnitDialogComponent,
        {},
        app
      );
    } else {
      this.hsSensorsUnitDialogService.get(app).unitDialogVisible = true;
    }
    if (this.hsSensorsUnitDialogService.get(app).currentInterval == undefined) {
      this.hsSensorsUnitDialogService.get(app).currentInterval = {
        amount: 1,
        unit: 'days',
      };
    }
    this.hsSensorsUnitDialogService
      .getObservationHistory(
        unit,
        this.hsSensorsUnitDialogService.get(app).currentInterval,
        app
      )
      .then((_) => this.hsSensorsUnitDialogService.createChart(unit, app));
    this.hsMapService
      .getMap(app)
      .getView()
      .fit(unit.feature.getGeometry(), {maxZoom: 16});
  }

  /**
   * Create layer for displaying sensor data
   * @param app - App identifier
   */
  createLayer(app: string) {
    const appRef = this.get(app);
    const me = this;
    appRef.bookmarkStyle = [
      new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#e49905',
          width: 2,
        }),
        image: new Icon({
          src: this.hsUtilsService.getAssetsPath(app) + 'img/icons/wifi8.svg',
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
      }),
      appRef.labelStyle,
    ];
    appRef.layer = new VectorLayer<VectorSource<Geometry>>({
      properties: {
        title: 'Sensor units',
        editor: {
          editable: false,
        },
      },
      style: function (feature: Feature<Geometry>) {
        me.get(app).labelStyle.getText().setText(getFeatureName(feature));
        return me.get(app).bookmarkStyle;
      },
      source: new VectorSource({}),
    });
    this.hsMapService.getMap(app).addLayer(appRef.layer);
  }

  /**
   * Get list of units from Senslog backend
   * @param app - App identifier
   */
  getUnits(app: string) {
    const appRef = this.get(app);
    if (appRef.layer === null) {
      this.createLayer(app);
    }
    const url = this.hsUtilsService.proxify(
      `${appRef.endpoint.url}/${appRef.endpoint.liteApiPath}/rest/unit`,
      app
    );
    this.http
      .get(url, {
        params: {
          user_id: appRef.endpoint.user_id.toString(),
        },
      })
      .subscribe((response) => {
        appRef.units = response;
        appRef.layer.getSource().clear();
        const features = appRef.units
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
        appRef.layer.getSource().addFeatures(features);
        this.fillLastObservations(app);
        appRef.units.forEach((unit: HsSensorUnit) => {
          unit.sensorTypes = unit.sensors.map((s) => {
            return {name: s.sensor_type};
          });
          unit.sensors.sort((a, b) => {
            return b.sensor_id - a.sensor_id;
          });
          for (const sensor of unit.sensors) {
            sensor.sensor_name_translated =
              this.hsLanguageService.getTranslationIgnoreNonExisting(
                'SENSORS.SENSORNAMES',
                sensor.sensor_name
              );
            sensor.phenomenon_name_translated =
              this.hsLanguageService.getTranslationIgnoreNonExisting(
                'SENSORS.PHENOMENON',
                sensor.phenomenon_name
              );
          }
          unit.sensorTypes = this.hsUtilsService.removeDuplicates(
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
        setInterval(() => this.fillLastObservations(app), 60000);
      });
  }

  /**
   * Filter sensors based on the query value
   * @param sensors -
   * @param query -
   */
  filterquery(sensors, query) {
    return sensors.filter(
      (s) =>
        query.description == '' ||
        s.description.toLowerCase().indexOf(query.description.toLowerCase()) >
          -1
    );
  }

  /**
   * Fill observations
   * @param app - App identifier
   */
  fillLastObservations(app: string): void {
    const appRef = this.get(app);
    this.http

      .get(
        this.hsUtilsService.proxify(
          `${appRef.endpoint.url}/${appRef.endpoint.senslog1Path}/SensorService`,
          app
        ),
        {
          params: {
            Operation: 'GetLastObservations',
            group: appRef.endpoint.group,
            user: appRef.endpoint.user,
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
        appRef.units.forEach((unit: HsSensorUnit) => {
          unit.sensors.forEach((sensor) => {
            this.hsSensorsUnitDialogService.get(app).sensorById[
              sensor.sensor_id
            ] = sensor;
            if (sensorValues[sensor.sensor_id]) {
              sensor.lastObservationValue =
                sensorValues[sensor.sensor_id].value;
              const feature = this.apps[app].layer
                .getSource()
                .getFeatures()
                .find((f) => getUnitId(f) == unit.unit_id);
              feature.set(
                sensor.sensor_name,
                sensorValues[sensor.sensor_id].value
              );
              sensor.lastObservationTimestamp =
                sensorValues[sensor.sensor_id].timestamp;
            }
          });
        });
      });
  }
}
