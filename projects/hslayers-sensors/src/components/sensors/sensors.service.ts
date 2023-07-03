import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import Feature from 'ol/Feature';
import dayjs from 'dayjs';
import {Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {Geometry, MultiPolygon} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
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
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {HsUtilsService} from 'hslayers-ng';
import {SensLogEndpoint} from './types/senslog-endpoint.type';

class SensorsServiceParams {
  units: any = [];
  layer = null;
  endpoint: SensLogEndpoint;
}
const VISUALIZED_ATTR = 'Visualized attribute';
@Injectable({
  providedIn: 'root',
})
export class HsSensorsService {
  sensorMarkerStyle: {
    [id: string]: Style[];
  } = {};
  labelStyle: Style;
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
  visualizedAttribute = new Subject<{app: string; attribute: string}>();

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
      title: 'PANEL_HEADER.SENSORS',
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
    this.labelStyle = this.olStyle;
    this.hsConfig.configChanges.subscribe(() => {
      if (this.hsConfig.get(app).senslog != appRef.endpoint) {
        this.setEndpoint(app);
      }
    });
    this.setEndpoint(app);
    this.hsSensorsUnitDialogService.init(app);

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
    const appRef = this.get(app);
    for (const feature of appRef.layer.getSource().getFeatures()) {
      feature.set(VISUALIZED_ATTR, sensor.sensor_name);
    }
    this.visualizedAttribute.next({app, attribute: sensor.sensor_name});
    sensor.checked = true;
  }

  /**
   * Deselect sensor unit and refresh sensors state
   */
  deselectUnit(unit, app: string) {
    const unitDialogServiceRef = this.hsSensorsUnitDialogService.get(app);
    unitDialogServiceRef.unit = unitDialogServiceRef.unit.filter(
      (u) => u.unit_id !== unit.unit_id
    );
    unit.feature.set('selected', undefined);
    unit.sensors
      .filter((s) => s.checked)
      .forEach((s) => {
        s.checked = false;
        this.hsSensorsUnitDialogService.toggleSensor(s, app);
      });
    delete unitDialogServiceRef.aggregations[unit.description];
    this.hsSensorsUnitDialogService.filterObservations(unit, app);
    unit.expanded = false;
  }

  /**
   * Select unit from available Units
   * @param unit - Unit selected
   * @param app - App identifier
   */
  selectUnit(unit: HsSensorUnit, app: string): void {
    const unitDialogServiceRef = this.hsSensorsUnitDialogService.get(app);
    /**
     * Multiple units allowed
     */
    if (unitDialogServiceRef.comparisonAllowed) {
      //If already in 'selection' drop it, remove from aggregations and reset its sensors state
      if (unitDialogServiceRef.unit.find((u) => u.unit_id == unit.unit_id)) {
        this.deselectUnit(unit, app);
        if (unitDialogServiceRef.unit.length > 0) {
          this.hsSensorsUnitDialogService.createChart(
            unitDialogServiceRef.unit,
            app
          );
        } else {
          this.closeSensorDialog(app);
        }
        return;
      } else {
        unitDialogServiceRef.unit.push(unit);
      }
    } else {
      /**
       * Single unit only
       */
      if (
        unitDialogServiceRef.unit[0]?.unit_id === unit.unit_id &&
        unitDialogServiceRef.unitDialogVisible
      ) {
        unit.expanded = !unit.expanded;
        return;
      }
      this.hsSensorsUnitDialogService.resetAggregations(app);
      //Reset features and sensors belonging to previously selected unit
      unitDialogServiceRef.unit.forEach((u) => {
        u.feature.set('selected', undefined);
        u.expanded = false;
        u.sensors.forEach((s) => (s.checked = false));
      });
      unitDialogServiceRef.sensorsSelected = [];
      unitDialogServiceRef.sensorIdsSelected = [];

      unitDialogServiceRef.unit = [unit];
    }
    unit.expanded = !unit.expanded;
    //this.selectSensor(unit.sensors[0]);
    //Create/show unit dialog
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
      unitDialogServiceRef.unitDialogVisible = true;
    }
    //Set interval for selected sensor unit
    if (unitDialogServiceRef.currentInterval == undefined) {
      unitDialogServiceRef.currentInterval = {
        amount: 1,
        unit: 'days',
      };
    }
    //Get observations for selected unit
    this.hsSensorsUnitDialogService
      .getObservationHistory(unit, unitDialogServiceRef.currentInterval, app)
      .then((_) =>
        this.hsSensorsUnitDialogService.createChart(
          unitDialogServiceRef.comparisonAllowed
            ? unitDialogServiceRef.unit
            : unit,
          app
        )
      );

    unit.feature.set('selected', true);
    this.hsMapService
      .getMap(app)
      .getView()
      .fit(unit.feature.getGeometry(), {maxZoom: 16});
  }

  /**
   * Close sensor unit dialog
   */
  closeSensorDialog(app: string): void {
    const dialog = this.hsDialogContainerService
      .get(app)
      .dialogs.find((d) =>
        this.hsUtilsService.instOf(d, HsSensorsUnitDialogComponent)
      );
    this.hsDialogContainerService.destroy(dialog, app);
    this.hsSensorsUnitDialogService.get(app).unitDialogVisible = false;
  }

  /**
   * Create layer for displaying sensor data
   * @param app - App identifier
   */
  createLayer(app: string) {
    const appRef = this.get(app);
    const configRef = this.hsConfig.get(app);
    this.sensorMarkerStyle[app] = [
      new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#e49905',
          width: 2,
        }),
        image: new Icon({
          src: configRef.assetsPath + 'img/icons/wifi8.svg',
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
      }),
      this.labelStyle,
    ];
    appRef.layer = new VectorLayer<VectorSource<Geometry>>({
      properties: {
        title: 'Sensor units',
        popUp: {
          attributes: ['*'],
        },
        editor: {
          editable: false,
        },
      },
      style: (feature: Feature<Geometry>) => {
        if (
          feature.get(VISUALIZED_ATTR) &&
          feature.get(feature.get(VISUALIZED_ATTR)) != undefined
        ) {
          this.labelStyle
            .getText()
            .setText(feature.get(feature.get(VISUALIZED_ATTR)).toString());
        } else {
          this.labelStyle.getText().setText(getFeatureName(feature));
        }
        this.labelStyle.getText().setScale(feature.get('selected') ? 2 : 1);
        return this.sensorMarkerStyle[app];
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
        appRef.units.forEach((unit: HsSensorUnit) => {
          unit.sensors.forEach((sensor) => {
            sensor.sensor_id = `${unit.unit_id}_${sensor.sensor_id}`;
            this.hsSensorsUnitDialogService.get(app).sensorById[
              sensor.sensor_id
            ] = sensor;
            sensor.unit_id = unit.unit_id;
            sensor.unit_description = unit.description;
          });
        });
        this.fillLastObservations(app);
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
    const url = appRef.endpoint.senslog2Path
      ? `${appRef.endpoint.url}/${appRef.endpoint.senslog2Path}/rest/observation/last`
      : `${appRef.endpoint.url}/${appRef.endpoint.senslog1Path}/SensorService`;
    const params = appRef.endpoint.senslog2Path
      ? {group_name: appRef.endpoint.group}
      : {
          Operation: 'GetLastObservations',
          group: appRef.endpoint.group,
          user: appRef.endpoint.user,
        };
    this.http

      .get(this.hsUtilsService.proxify(url, app), {
        params,
      })
      .subscribe((response: any) => {
        const sensorValues = {};
        response.forEach((sv) => {
          sensorValues[`${sv.unitId}_${sv.sensorId}`] = {
            value: sv.observedValue,
            timestamp: dayjs(sv.timeStamp).format('DD.MM.YYYY HH:mm'),
          };
        });
        appRef.units.forEach((unit: HsSensorUnit) => {
          unit.sensors.forEach((sensor) => {
            /**
             * NOTE:
             *  In order to distinguish between sensors in different units sensor_id
             *  is constructed as `${sv.unit_id}_${sv.sensor_id} see getUnits
             */
            const reading = sensorValues[sensor.sensor_id];
            if (reading) {
              sensor.lastObservationValue = reading.value;
              const feature = this.apps[app].layer
                .getSource()
                .getFeatures()
                .find((f) => getUnitId(f) == unit.unit_id);
              if (feature) {
                feature.set(sensor.sensor_name_translated, reading.value);
                feature.set(
                  sensor.sensor_name_translated + ' at ',
                  reading.timestamp
                );
              } else {
                console.log(`No feature exists for unit ${unit.unit_id}`);
              }

              sensor.lastObservationTimestamp = reading.timestamp;
            }
          });
        });
      });
  }
}
