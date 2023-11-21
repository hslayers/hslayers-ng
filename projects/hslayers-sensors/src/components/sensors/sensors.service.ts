import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {LangChangeEvent} from '@ngx-translate/core';
import {Subject} from 'rxjs';

import dayjs from 'dayjs';
import {
  HsConfig,
  HsDialogContainerService,
  HsEventBusService,
  HsLanguageService,
  HsLayoutService,
  HsLogService,
  HsMapService,
  HsQueryVectorService,
  HsSidebarService,
  HsStylerService,
  HsUtilsService,
  getUnitId,
  setFeatureName,
  setUnitId,
} from 'hslayers-ng';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {WKT} from 'ol/format';

import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {SensLogEndpoint} from './types/senslog-endpoint.type';
import {sensorUnitStyle} from './partials/sensor-unit';

const VISUALIZED_ATTR = 'Visualized attribute';
@Injectable({
  providedIn: 'root',
})
export class HsSensorsService {
  units: any = [];
  layer = null;
  endpoint: SensLogEndpoint;
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
    private hsLanguageService: HsLanguageService,
    private hsStylerService: HsStylerService,
    private hsQueryVectorService: HsQueryVectorService,
    private hsLog: HsLogService,
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
      this.hsConfig.configChanges.subscribe(() => {
        if (this.hsConfig.senslog != this.endpoint) {
          this.setEndpoint();
          this.getUnits();
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
                (unit: HsSensorUnit) => (unit.expanded = false),
              );
              this.selectUnit(
                this.units.filter(
                  (unit: HsSensorUnit) =>
                    unit.unit_id == getUnitId(event.feature),
                )[0],
              );
            }
          },
          150,
          false,
          this,
        )();
      });
    });
    const translator = this.hsLanguageService.getTranslator();
    translator.onLangChange.subscribe((event: LangChangeEvent) => {
      this.units.forEach((unit) => {
        this.setSensorTranslations(unit);
      });
    });
  }

  /**
   * Update senor name and phenomenon translations
   * @param unit - Sensor unit
   */
  private setSensorTranslations(unit) {
    for (const sensor of unit.sensors) {
      sensor.sensor_name_translated =
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'SENSORS.SENSORNAMES',
          sensor.sensor_name,
        );
      sensor.phenomenon_name_translated =
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'SENSORS.PHENOMENON',
          sensor.phenomenon_name,
        );
    }
  }

  /**
   * Deselect sensor unit and refresh sensors state
   */
  deselectUnit(unit) {
    this.hsSensorsUnitDialogService.unit =
      this.hsSensorsUnitDialogService.unit.filter(
        (u) => u.unit_id !== unit.unit_id,
      );
    unit.feature?.set('selected', undefined);
    unit.sensors
      .filter((s) => s.checked)
      .forEach((s) => {
        s.checked = false;
        this.hsSensorsUnitDialogService.toggleSensor(s);
      });
    delete this.hsSensorsUnitDialogService.aggregations[unit.description];
    this.hsSensorsUnitDialogService.filterObservations(unit);
    unit.expanded = false;
  }

  /**
   * Set endpoint for sensors service to receive data from Senslog
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
    /**
     * Multiple units allowed
     */
    if (this.hsSensorsUnitDialogService.comparisonAllowed) {
      //If already in 'selection' drop it, remove from aggregations and reset its sensors state
      if (
        this.hsSensorsUnitDialogService.unit.find(
          (u) => u.unit_id == unit.unit_id,
        )
      ) {
        this.deselectUnit(unit);
        if (this.hsSensorsUnitDialogService.unit.length > 0) {
          this.hsSensorsUnitDialogService.createChart(
            this.hsSensorsUnitDialogService.unit,
          );
        } else {
          this.closeSensorDialog();
        }
        return;
      } else {
        this.hsSensorsUnitDialogService.unit.push(unit);
      }
    } else {
      /**
       * Single unit only
       */
      if (
        this.hsSensorsUnitDialogService.unit[0]?.unit_id === unit.unit_id &&
        this.hsSensorsUnitDialogService.unitDialogVisible
      ) {
        unit.expanded = !unit.expanded;
        return;
      }
      this.hsSensorsUnitDialogService.resetAggregations();
      //Reset features and sensors belonging to previously selected unit
      this.hsSensorsUnitDialogService.unit.forEach((u) => {
        u.feature?.set('selected', undefined);
        u.expanded = false;
        u.sensors.forEach((s) => (s.checked = false));
      });
      this.hsSensorsUnitDialogService.sensorsSelected = [];
      this.hsSensorsUnitDialogService.sensorIdsSelected = [];

      this.hsSensorsUnitDialogService.unit = [unit];
    }
    unit.expanded = !unit.expanded;
    //this.selectSensor(unit.sensors[0]);
    //Create/show unit dialog
    if (
      !this.hsDialogContainerService.dialogs.some((d) =>
        this.hsUtilsService.instOf(d, HsSensorsUnitDialogComponent),
      )
    ) {
      this.hsDialogContainerService.create(HsSensorsUnitDialogComponent, {});
    } else {
      this.hsSensorsUnitDialogService.unitDialogVisible = true;
    }
    //Set interval for selected sensor unit
    if (this.hsSensorsUnitDialogService.currentInterval == undefined) {
      this.hsSensorsUnitDialogService.currentInterval = {
        amount: 1,
        unit: 'days',
        name: '1D',
      };
    }
    //Get observations for selected unit
    this.hsSensorsUnitDialogService
      .getObservationHistory(
        unit,
        this.hsSensorsUnitDialogService.currentInterval,
      )
      .then((_) =>
        this.hsSensorsUnitDialogService.createChart(
          this.hsSensorsUnitDialogService.comparisonAllowed
            ? this.hsSensorsUnitDialogService.unit
            : unit,
        ),
      );

    unit.feature?.set('selected', true);
    this.hsMapService
      .getMap()
      .getView()
      .fit(unit.feature.getGeometry(), {maxZoom: 16});
  }

  /**
   * Close sensor unit dialog
   */
  closeSensorDialog(): void {
    const dialog = this.hsDialogContainerService.dialogs.find((d) =>
      this.hsUtilsService.instOf(d, HsSensorsUnitDialogComponent),
    );
    this.hsDialogContainerService.destroy(dialog);
    this.hsSensorsUnitDialogService.unitDialogVisible = false;
  }

  /**
   * Create layer for displaying sensor data
   */
  createLayer() {
    this.layer = new VectorLayer<VectorSource>({
      properties: {
        path: 'Sensors',
        title: 'Sensor units',
        popUp: {
          attributes: ['*'],
        },
        editor: {
          editable: false,
        },
        sld: sensorUnitStyle,
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
      `${this.endpoint.url}/${this.endpoint.liteApiPath}/rest/unit`,
    );
    this.http
      .get(url, {
        params: {
          user_id: this.endpoint.user_id.toString(),
        },
      })
      .subscribe({
        next: (response) => {
          this.units = response;
          this.layer.getSource().clear();
          const features = this.units
            .filter(
              (unit: HsSensorUnit) =>
                unit.unit_position && unit.unit_position.asWKT,
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

          this.units.forEach((unit: HsSensorUnit) => {
            unit.sensors.sort((a, b) => {
              return b.sensor_id - a.sensor_id;
            });

            unit.sensorTypes = unit.sensors.map((s) => {
              s.sensor_id = `${unit.unit_id}_${s.sensor_id}`;
              this.hsSensorsUnitDialogService.sensorById[s.sensor_id] = s;
              s.unit_id = unit.unit_id;
              s.unit_description = unit.description;

              return {name: s.sensor_type};
            });

            this.setSensorTranslations(unit);
            unit.sensorTypes = this.hsUtilsService.removeDuplicates(
              unit.sensorTypes,
              'name',
            );
            unit.sensorTypes.map(
              (sensorType) =>
                (sensorType.sensors = unit.sensors.filter(
                  (s) => s.sensor_type == sensorType.name,
                )),
            );
          });

          this.fillLastObservations();
          setInterval(() => this.fillLastObservations(), 60000);
        },
        error: (e) => {
          console.error('Unit loading failed', e);
        },
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
          -1,
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
          sensorValues[`${sv.unitId}_${sv.sensorId}`] = {
            value: sv.observedValue,
            timestamp: dayjs(sv.timeStamp).format('DD.MM.YYYY HH:mm'),
          };
        });
        this.units.forEach((unit: HsSensorUnit) => {
          unit.sensors.forEach((sensor) => {
            /**
             * NOTE:
             *  In order to distinguish between sensors in different units sensor_id
             *  is constructed as `${sv.unit_id}_${sv.sensor_id} see getUnits
             */
            const reading = sensorValues[sensor.sensor_id];
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
                  reading.timestamp,
                );
              } else {
                this.hsLog.log(`No feature exists for unit ${unit.unit_id}`);
              }
              sensor.lastObservationTimestamp = reading.timestamp;
            }
          });
        });
      });
  }
}
