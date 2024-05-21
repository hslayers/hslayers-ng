import dayjs from 'dayjs';
import {HttpClient} from '@angular/common/http';
import {Inject, Injectable, Optional, inject} from '@angular/core';
import {Subject, concatMap, map, take} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {
  getUnitId,
  setFeatureName,
  setUnitId,
} from 'hslayers-ng/common/extensions';

import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {WKT} from 'ol/format';

import {HsMapService} from 'hslayers-ng/services/map';
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {SensLogEndpoint} from './types/senslog-endpoint.type';
import {SenslogResponse} from './types/senslog-response.type';
import {SenslogSensor} from './types/senslog-sensor.type';
import {sensorUnitStyle} from './partials/sensor-unit';

const VISUALIZED_ATTR = 'Visualized attribute';
@Injectable({
  providedIn: 'root',
})
export class HsSensorsService {
  units: HsSensorUnit[] = [];
  layer = null;
  endpoint: SensLogEndpoint;
  visualizedAttribute = new Subject<{attribute: string}>();

  /**
   * Available when showing only single sensor unit selected by unit_id url param
   */
  unitInUrl: number;

  hsMapService;

  constructor(
    private hsUtilsService: HsUtilsService,
    private hsConfig: HsConfig,
    private hsLayoutService: HsLayoutService,
    private hsDialogContainerService: HsDialogContainerService,
    private http: HttpClient,
    private hsEventBusService: HsEventBusService,
    private hsSensorsUnitDialogService: HsSensorsUnitDialogService,
    private hsLog: HsLogService,
    @Optional() @Inject('MAPSERVICE_DISABLED') mapServiceDisabled: boolean,
    @Optional() @Inject('HsQueryVectorService') hsQueryVectorService,
  ) {
    const urlParams = new URLSearchParams(location.search);
    this.unitInUrl = parseInt(urlParams.get('unit_id'));

    /**
     * Injection token used to enable lighter version of hslayers-sensors output
     * (without map to mainly display chart for sensors of one unit)
     * Needs to be provided in consumer application module providers array
     * @example  providers: [{provide: 'MAPSERVICE_DISABLED', useValue: true}],
     */
    if (!mapServiceDisabled) {
      this.hsMapService = inject(HsMapService);
    }

    (this.hsMapService ? this.hsMapService.loaded() : Promise.resolve()).then(
      () => {
        this.hsConfig.configChanges.subscribe(() => {
          if (this.hsConfig.senslog != this.endpoint) {
            this.setEndpoint();
          }
        });
        this.setEndpoint();

        this.hsEventBusService.vectorQueryFeatureSelection.subscribe(
          (event) => {
            this.hsUtilsService.debounce(
              () => {
                if (
                  this.hsMapService.getLayerForFeature(event.feature) ==
                  this.layer
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
          },
        );
      },
    );
  }

  /**
   * Deselect sensor unit and refresh sensors state
   */
  deselectUnit(unit: HsSensorUnit) {
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

      if (this.units.length == 0) {
        this.getUnits();
      }
    }
  }

  /**
   * Select sensor from available sensors
   * @param sensor - Sensor selected
   */
  selectSensor(sensor: SenslogSensor): void {
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
    if (!unit) {
      return;
    }
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
      this.hsSensorsUnitDialogService.sensorsSelected.clear();

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
      ? this.hsMapService
          .getMap()
          .getView()
          .fit(unit.feature.getGeometry(), {maxZoom: 16})
      : null;
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
    this.layer = new VectorLayer<Feature>({
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
    this.hsMapService ? this.hsMapService.getMap().addLayer(this.layer) : null;
  }

  /**
   * Get list of units from Senslog backend
   */
  getUnits() {
    if (this.layer === null) {
      this.hsEventBusService.mapEventHandlersSet
        .pipe(take(1))
        .subscribe((_) => {
          this.createLayer();
        });
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
      .pipe(
        map((response: SenslogResponse[]) => {
          const filter = this.hsConfig.senslog.filter;

          return this.unitInUrl || filter
            ? response.filter((s) => {
                // If there is an unit_id GET param, give it a priority and get only the selected unit
                if (this.unitInUrl) {
                  return s['unit_id'] == this.unitInUrl;
                }

                // If config filter exists, take only whitelisted units
                if (filter) {
                  const unitFilter = filter[s['unit_id']];
                  const defaultFilter = filter.default;

                  // Include unit if specific unit filter is defined or if default filter includes sensors for all units
                  return (
                    unitFilter !== undefined || defaultFilter !== undefined
                  );
                }

                return false;
              })
            : response; // Return the whole response otherwise
        }),
        // Wait for the mapEventHandlersSet to make sure this.layer exists
        concatMap((filteredResponse) =>
          this.hsEventBusService.mapEventHandlersSet.pipe(
            map(() => filteredResponse),
          ),
        ),
      )
      .subscribe({
        next: (response) => {
          this.units = response;
          /**
           * Assuming there is no getMap method implemented in custom lightweight mapService class
           */
          if (this.hsMapService) {
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
          }
          this.units.forEach((unit: HsSensorUnit) => {
            unit.sensors = unit.sensors
              .filter((s) => this.sensorAllowed(s, unit))
              .sort((a, b) => {
                return (b.sensor_id as number) - (a.sensor_id as number);
              });

            unit.sensorTypes = unit.sensors.map((s) => {
              // Changing the type of sensor_id from number to string, not ideal
              s.sensor_id = `${unit.unit_id}_${s.sensor_id}`;
              s.unit_id = unit.unit_id;
              s.unit_description = unit.description;
              this.hsSensorsUnitDialogService.sensorById[s.sensor_id] = s;

              return {name: s.sensor_type};
            });

            unit.sensorTypes = this.hsUtilsService.removeDuplicates(
              unit.sensorTypes,
              'name',
            );
            unit.sensorTypes.map((sensorType) => {
              sensorType.sensors = unit.sensors.filter(
                (s) => s.sensor_type == sensorType.name,
              );
              sensorType.expanded = this.unitInUrl
                ? unit.sensorTypes.length <= 7
                : false;
            });
          });

          this.fillLastObservations();
          if (this.unitInUrl) {
            this.selectUnit(this.units[0]);
          }
          setInterval(() => this.fillLastObservations(), 60000);
        },
        error: (e) => {
          console.error('Unit loading failed', e);
        },
      });
  }

  /**
   * Determine wether the sensor should be visible or not based on filter
   */
  private sensorAllowed(s: SenslogSensor, u: HsSensorUnit): boolean {
    const filter = this.hsConfig.senslog.filter;

    if (filter) {
      const sensor_filter = filter[u.unit_id] || filter.default;
      return (
        sensor_filter === 'all' ||
        (Array.isArray(sensor_filter) &&
          sensor_filter.includes(s.sensor_id as number))
      );
    }

    return !(s.phenomenon_name as string).includes('TODO');
  }

  /**
   * Filter sensors based on the query value
   * @param sensors -
   * @param query -
   */
  filterquery(units: HsSensorUnit[], query) {
    return units.filter(
      (u) =>
        query.description == '' ||
        u.description.toLowerCase().indexOf(query.description.toLowerCase()) >
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
              sensor.lastObservationTimestamp = reading.timestamp;
              sensor.lastObservationValue = reading.value;
              if (this.hsMapService) {
                const feature = this.layer
                  .getSource()
                  .getFeatures()
                  .find((f) => getUnitId(f) == unit.unit_id);
                if (feature) {
                  feature.set(sensor.sensor_name, reading.value);
                  feature.set(sensor.sensor_name + ' at ', reading.timestamp);
                } else {
                  this.hsLog.log(`No feature exists for unit ${unit.unit_id}`);
                }
              }
            }
          });
        });
      });
  }
}
