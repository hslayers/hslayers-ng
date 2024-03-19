import {Component, OnDestroy, OnInit} from '@angular/core';

import * as polygonClipping from 'polygon-clipping';
import polygonSplitter from 'polygon-splitter';
import {Feature} from 'ol';
import {Polygon} from 'ol/geom';
import {Vector} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';

import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsQueryBaseService} from 'hslayers-ng/services/query';
import {HsQueryVectorService} from 'hslayers-ng/services/query';
import {HsToastService} from 'hslayers-ng/common/toast';
import {defaultStyle} from 'hslayers-ng/services/styler';

@Component({
  selector: 'hs-draw-edit',
  templateUrl: './draw-edit.component.html',
  styleUrls: ['./draw-edit.component.scss'],
})
export class DrawEditComponent implements OnDestroy, OnInit {
  vectorQueryFeatureSubscription;
  editOptions = ['difference', 'union', 'intersection', 'split'];
  selectedType: 'difference' | 'union' | 'intersection' | 'split';

  selectedFeature;
  editLayer = new VectorLayer({
    properties: {
      title: 'Layer editor helper',
      queryable: true,
      showInLayerManager: false,
      sld: defaultStyle,
    },
    source: new Vector({}),
  });

  constructor(
    public HsDrawService: HsDrawService,
    public HsQueryBaseService: HsQueryBaseService,
    public HsQueryVectorService: HsQueryVectorService,
    public HsLanguageService: HsLanguageService,
    private hsLog: HsLogService,
    public hsMapService: HsMapService,
    public hsToastService: HsToastService,
    public hsEventBusService: HsEventBusService,
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.HsDrawService.selectedLayer) {
      this.HsDrawService.previouslySelected = this.HsDrawService.selectedLayer;
    } else {
      this.HsDrawService.previouslySelected = null;
    }

    await this.hsMapService.loaded();
    this.hsMapService.getMap().addLayer(this.editLayer);
    this.checkFeatureGeometryType(
      this.HsQueryVectorService.selector.getFeatures().getArray()[0],
    );
    this.vectorQueryFeatureSubscription =
      this.hsEventBusService.vectorQueryFeatureSelection.subscribe((data) => {
        const selectorFeatures = data.selector.getFeatures().getArray();
        if (!this.checkFeatureGeometryType(selectorFeatures[0])) {
          return;
        }
        if (
          selectorFeatures.length > 1 &&
          this.editLayer !=
            this.hsMapService.getLayerForFeature(data.feature) &&
          this.selectedType == 'split'
        ) {
          if (selectorFeatures.length == 3) {
            //Switch between two splitting lines
            if (selectorFeatures[2].getGeometry().getType() == 'LineString') {
              data.selector.getFeatures().remove(selectorFeatures[1]);
              this.hsToastService.createToastPopupMessage(
                this.HsLanguageService.getTranslation(
                  'DRAW.featureEditor.featureEditor',
                  undefined,
                ),
                this.HsLanguageService.getTranslation(
                  'DRAW.featureEditor.onlyOneSplitLine',
                  undefined,
                ),
                {
                  toastStyleClasses: 'bg-info text-light',
                },
              );
            } else {
              //Remove lastly selected feature.
              //TODO: Feature is removed from selector properly but its style is not refreshed (looks like it's still selected)
              data.selector.getFeatures().pop();
            }
          }
          if (
            selectorFeatures.length == 2 &&
            selectorFeatures[1].getGeometry().getType() != 'LineString'
          ) {
            this.deselectMultiple();
          }
        }
      });
  }

  ngOnDestroy() {
    this.hsMapService.loaded().then((map) => {
      map.removeLayer(this.editLayer);
      this.setType(this.HsDrawService.type);
      //Timeout necessary because setType triggers async deactivateDrawing
      //HsDrawService.draw needs to be null in order to change draw source properly
      setTimeout(() => {
        if (this.HsDrawService.previouslySelected) {
          this.HsDrawService.selectedLayer =
            this.HsDrawService.previouslySelected;
          this.HsDrawService.changeDrawSource();
        } else {
          this.HsDrawService.fillDrawableLayers();
        }
      });
      this.vectorQueryFeatureSubscription.unsubscribe();
    });
  }

  /**
   * Check whether selected feature geometry type is valid
   * (Geometry operations work on polygon only)
   */
  checkFeatureGeometryType(feature) {
    if (!feature) {
      return false;
    }
    const isValidType = feature.getGeometry().getType() == 'Polygon';
    if (!isValidType) {
      this.hsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation(
          'DRAW.featureEditor.featureEditor',
          undefined,
        ),
        'Only polygon geometry can be edited',
        undefined,
      );
      this.resetState();
    }
    return isValidType;
  }

  /**
   * Selects geometry operation (one of editOptions)
   */
  selectGeomOperation(option): void {
    const features = this.HsQueryVectorService.selector.getFeatures();
    this.selectedType = option;

    if (this.HsDrawService.draw) {
      const drawTypeRequired = option == 'split' ? 'LineString' : 'Polygon';
      if (this.HsDrawService.type != drawTypeRequired) {
        this.setType(drawTypeRequired);
      }
    }

    if (this.selectedType == 'split') {
      if (this.editLayer.getSource().getFeatures().length > 0) {
        this.editLayer.getSource().clear();
      }
      if (features.getLength() > 1) {
        this.deselectMultiple();
      }
      this.setType('LineString'); //Commence drawing right away
    } else {
      if (features.getLength() > 1) {
        //Remove non polygon features from selection
        const featuresToRemove = features
          .getArray()
          .filter((feature) => feature.getGeometry().getType() != 'Polygon');
        for (const feature of featuresToRemove) {
          features.remove(feature);
        }
      }
    }
  }

  /**
   * Deselects multi selection. Only one feature can be edited at the time
   * Index can specify which feature to preserve in selection
   */
  deselectMultiple(index = 1): void {
    this.hsToastService.createToastPopupMessage(
      this.HsLanguageService.getTranslation('DRAW.featureEditor.featureEditor'),
      this.HsLanguageService.getTranslation(
        'DRAW.featureEditor.onlyOneFeatureToEdit',
        undefined,
      ),
      {
        toastStyleClasses: 'bg-info text-light',
      },
    );
    setTimeout(() => {
      try {
        const feature = this.HsQueryBaseService.selector
          .getFeatures()
          .getArray()[index];
        this.HsQueryBaseService.clear('features');
        this.HsQueryBaseService.selector.getFeatures().clear();
        this.HsQueryBaseService.selector.getFeatures().push(feature);
        this.HsQueryVectorService.createFeatureAttributeList();
      } catch (error) {
        this.hsLog.error(error);
      }
    });
  }

  /**
   * Custom onDrawEnd callback preventing HsQueryBaseService.clearData
   */
  onDrawEnd(e): void {
    setTimeout(() => {
      if (this.selectedType == 'split') {
        const features = this.editLayer.getSource().getFeatures();
        if (features.length > 1) {
          this.HsQueryVectorService.removeFeature(features[0]);

          this.hsToastService.createToastPopupMessage(
            this.HsLanguageService.getTranslation(
              'DRAW.featureEditor.featureEditor',
              undefined,
            ),
            this.HsLanguageService.getTranslation(
              'DRAW.featureEditor.onlyOneSplitLine',
              undefined,
            ),
            {
              toastStyleClasses: 'bg-info text-light',
            },
          );
        }
      }

      this.HsDrawService.addFeatureToSelector(e.feature);
    });
  }

  selectionMenuToggled(): void {
    this.setType(this.HsDrawService.type);
    this.editLayer.getSource().clear();
  }

  setType(what): void {
    this.HsDrawService.selectedLayer = this.editLayer;

    this.HsQueryBaseService.selector.setActive(
      what === this.HsDrawService.type,
    );
    this.HsDrawService.modify.setActive(what === this.HsDrawService.type);

    const type = this.HsDrawService.setType(what);
    if (type) {
      this.HsDrawService.activateDrawing({onDrawEnd: (e) => this.onDrawEnd(e)});
    }
    if (this.selectedType == 'split' && this.features.length > 1) {
      this.deselectMultiple(0);
    }
  }

  translateString(module: string, text: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

  /**
   * Modify firstly selected features with the output of polygonClipping
   */
  setCoordinatesToFirstFeature(coords): void {
    this.features[0].feature.getGeometry().setCoordinates(coords[0], 'XY');
  }

  get features() {
    return this.HsQueryBaseService.features;
  }

  modify(type): void | boolean {
    const features = [];
    const editCoords = [];

    this.features.forEach((feature, idx) => {
      if ((type == 'difference' && idx < 2) || type != 'difference') {
        features.push(feature.feature.clone());
      }
    });

    for (const index in features) {
      editCoords[index] = features[index].getGeometry().getCoordinates();
    }

    let newGeom;
    let properties;
    if (type === 'split') {
      const splittingLine =
        this.features.length > 1
          ? this.features[1].feature
          : this.editLayer.getSource().getFeatures()[0];

      newGeom = polygonSplitter(
        {
          type: 'Polygon',
          coordinates: editCoords[0],
        },
        {
          type: 'LineString',
          coordinates: splittingLine.getGeometry().getCoordinates(),
        },
      ).geometry.coordinates;
      properties = features[0].getProperties();
    } else {
      if (type == 'union' || type == 'intersection') {
        const properties = {};
        for (const f of features) {
          Object.assign(properties, f.getProperties());
        }
      }
      newGeom = polygonClipping[type](editCoords[0], ...editCoords.slice(1));
    }

    //TYPE SPECIFIC ACTION
    this[type](newGeom, properties);
  }

  intersection(newGeom, properties): void {
    if (newGeom.length > 0) {
      this.setCoordinatesToFirstFeature(newGeom);
      this.features[0].feature.setProperties(properties);
      this.resetState();
    } else {
      this.hsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation(
          'DRAW.featureEditor.featureEditor',
          undefined,
        ),
        this.HsLanguageService.getTranslation(
          'DRAW.featureEditor.noIntersection',
          undefined,
        ),
        {
          toastStyleClasses: 'bg-warning text-light',
        },
      );
    }
  }

  union(newGeom, properties): void {
    const features = this.features;
    const featuresLength = features.length;
    for (let i = 0; i <= featuresLength; i++) {
      //Remove all but the first (edited) features
      if (features.length != 1) {
        this.HsQueryVectorService.removeFeature(
          features[features.length - 1].feature, //pop() ??
        );
      }
    }
    this.features[0].feature.setProperties(properties);
    this.setCoordinatesToFirstFeature(newGeom);
    this.resetState();
  }

  split(coords, properties): void {
    for (const c of coords) {
      const layer = this.hsMapService.getLayerForFeature(
        this.features[0].feature,
      );
      const feature = new Feature(
        Object.assign(properties, {geometry: new Polygon(c)}),
      );

      layer.getSource().addFeature(feature);
    }
    for (const feature of this.features) {
      this.HsQueryVectorService.removeFeature(feature.feature);
    }
    this.resetState();
  }

  difference(newGeom: any[], properties): void {
    //TODO: Not sure what to do with properties here
    if (newGeom.length === 1) {
      this.setCoordinatesToFirstFeature(newGeom);
    } else {
      const layer = this.hsMapService.getLayerForFeature(
        this.features[0].feature,
      );

      for (const geom of newGeom) {
        const feature = new Feature(new Polygon(geom));

        layer.getSource().addFeature(feature);
      }

      for (const feature of this.features) {
        this.HsQueryVectorService.removeFeature(feature.feature);
      }
    }
    this.resetState();
  }

  resetState() {
    this.editLayer.getSource().clear();
    this.setType(this.HsDrawService.type);
    this.HsQueryBaseService.clear('features');
    this.HsQueryBaseService.selector.getFeatures().clear();
    this.HsQueryBaseService.selector.setActive(true);
  }
}
