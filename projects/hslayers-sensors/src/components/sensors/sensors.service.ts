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

const VISUALIZED_ATTR = 'Visualized attribute';
@Injectable({
  providedIn: 'root',
})
export class HsSensorsService {
  units: any = [];
  layer = null;
  endpoint: SensLogEndpoint;
  sensorMarkerStyle: Style[];
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

  visualizedAttribute = new Subject<{attribute: string}>();

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

    this.hsMapService.loaded().then(() => {
      this.labelStyle = this.olStyle;
      this.hsConfig.configChanges.subscribe(() => {
        if (this.hsConfig.senslog != this.endpoint) {
          this.setEndpoint();
        }
      });
      this.setEndpoint();

      this.hsEventBusService.vectorQueryFeatureSelection.subscribe((event) => {
        this.hsUtilsService.debounce(
          () => {
            if (
              this.hsMapService.getLayerForFeature(event.feature) == this.layer
            ) {
              this.hsLayoutService.setMainPanel('sensors');
              this.units.forEach(
                (unit: HsSensorUnit) => (unit.expanded = false)
              );
              this.selectUnit(
                this.units.filter(
                  (unit: HsSensorUnit) =>
                    unit.unit_id == getUnitId(event.feature)
                )[0]
              );
            }
          },
          150,
          false,
          this
        )();
      });
    });
  }

  /**
   * Set endpoint for sensors service to receive data from senslog
   
   */
  private setEndpoint() {
    if (this.hsConfig.senslog) {
      this.endpoint = this.hsConfig.senslog;
      if (this.endpoint.liteApiPath == undefined) {
        this.endpoint.liteApiPath = 'senslog-lite2';
      }
      if (this.endpoint.senslog1Path == undefined) {
        this.endpoint.senslog1Path = 'senslog1';
      }
      this.hsSensorsUnitDialogService.endpoint = this.endpoint;
    }
  }

  /**
   * Select sensor from available sensors
   * @param sensor - Sensor selected
   
   */
  selectSensor(sensor): void {
    this.hsSensorsUnitDialogService.selectSensor(sensor);
    for (const feature of this.layer.getSource().getFeatures()) {
      feature.set(VISUALIZED_ATTR, sensor.sensor_name);
    }
    this.visualizedAttribute.next({attribute: sensor.sensor_name});
    sensor.checked = true;
  }

  /**
   * Select unit from available Units
   * @param unit - Unit selected
   
   */
  selectUnit(unit: HsSensorUnit): void {
    this.hsSensorsUnitDialogService.unit?.feature.set('selected', undefined);
    this.hsSensorsUnitDialogService.unit = unit;
    unit.expanded = !unit.expanded;
    //this.selectSensor(unit.sensors[0]);
    if (
      !this.hsDialogContainerService.dialogs.some((d) =>
        this.hsUtilsService.instOf(d, HsSensorsUnitDialogComponent)
      )
    ) {
      this.hsDialogContainerService.create(HsSensorsUnitDialogComponent, {});
    } else {
      this.hsSensorsUnitDialogService.unitDialogVisible = true;
    }
    if (this.hsSensorsUnitDialogService.currentInterval == undefined) {
      this.hsSensorsUnitDialogService.currentInterval = {
        amount: 1,
        unit: 'days',
      };
    }
    this.hsSensorsUnitDialogService
      .getObservationHistory(
        unit,
        this.hsSensorsUnitDialogService.currentInterval
      )
      .then((_) => this.hsSensorsUnitDialogService.createChart(unit));
    unit.feature.set('selected', true);
    this.hsMapService
      .getMap()
      .getView()
      .fit(unit.feature.getGeometry(), {maxZoom: 16});
  }

  /**
   * Create layer for displaying sensor data
   
   */
  createLayer() {
    this.sensorMarkerStyle = [
      new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#e49905',
          width: 2,
        }),
        image: new Icon({
          src: this.hsConfig.assetsPath + 'img/icons/wifi8.svg',
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
      }),
      this.labelStyle,
    ];
    this.layer = new VectorLayer<VectorSource<Geometry>>({
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
        return this.sensorMarkerStyle;
      },
      source: new VectorSource({}),
    });
    this.hsMapService.getMap().addLayer(this.layer);
  }

  /**
   * Get list of units from Senslog backend
   
   */
  getUnits() {
    if (this.layer === null) {
      this.createLayer();
    }
    const url = this.hsUtilsService.proxify(
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
        this.units.forEach((unit: HsSensorUnit) => {
          unit.sensors.forEach((sensor) => {
            this.hsSensorsUnitDialogService.sensorById[sensor.sensor_id] =
              sensor;
          });
        });
        setInterval(() => this.fillLastObservations(), 60000);
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
   
   */
  fillLastObservations(): void {
    const url = this.endpoint.senslog2Path
      ? `${this.endpoint.url}/${this.endpoint.senslog2Path}/rest/observation/last`
      : `${this.endpoint.url}/${this.endpoint.senslog1Path}/SensorService`;
    const params = this.endpoint.senslog2Path
      ? {group_name: this.endpoint.group}
      : {
          Operation: 'GetLastObservations',
          group: this.endpoint.group,
          user: this.endpoint.user,
        };
    this.http

      .get(this.hsUtilsService.proxify(url), {
        params,
      })
      .subscribe((response: any) => {
        const sensorValues = {};
        response.forEach((sv) => {
          sensorValues[sv.unitId + sv.sensorId] = {
            value: sv.observedValue,
            timestamp: dayjs(sv.timeStamp).format('DD.MM.YYYY HH:mm'),
          };
        });
        this.units.forEach((unit: HsSensorUnit) => {
          unit.sensors.forEach((sensor) => {
            const reading = sensorValues[unit.unit_id + sensor.sensor_id];
            if (reading) {
              sensor.lastObservationValue = reading.value;
              const feature = this.layer
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
