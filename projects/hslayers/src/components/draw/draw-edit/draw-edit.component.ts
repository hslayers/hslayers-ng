import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import * as polygonClipping from 'polygon-clipping';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import polygonSplitter from 'polygon-splitter';
import {Vector} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';

import {HsDrawService} from '../draw.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsMapService} from '../../map/map.service';
import {HsQueryBaseService} from './../../query/query-base.service';
import {HsQueryVectorService} from './../../query/query-vector.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {defaultStyle} from '../../styles/styles';

@Component({
  selector: 'hs-draw-edit',
  templateUrl: './draw-edit.component.html',
  styleUrls: ['./draw-edit.component.scss'],
})
export class DrawEditComponent implements OnDestroy, OnInit {
  @Input() app = 'default';
  vectorQueryFeatureSubscription;
  editOptions = ['difference', 'union', 'intersection', 'split'];
  selectedType: 'difference' | 'union' | 'intersection' | 'split';

  selectedFeature;
  appRef;
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
    public hsMapService: HsMapService,
    public hsToastService: HsToastService,
    public hsEventBusService: HsEventBusService
  ) {}

  async ngOnInit(): Promise<void> {
    this.appRef = this.HsDrawService.get(this.app);

    if (this.appRef.selectedLayer) {
      this.appRef.previouslySelected = this.appRef.selectedLayer;
    } else {
      this.appRef.previouslySelected = null;
    }

    await this.hsMapService.loaded(this.app);
    this.hsMapService.getMap(this.app).addLayer(this.editLayer);
    this.HsQueryVectorService.init(this.app);
    this.checkFeatureGeometryType(
      this.HsQueryVectorService.apps[this.app].selector
        .getFeatures()
        .getArray()[0]
    );
    this.vectorQueryFeatureSubscription =
      this.hsEventBusService.vectorQueryFeatureSelection.subscribe((data) => {
        if (data.app == this.app) {
          const selectorFeatures = data.selector.getFeatures().getArray();
          if (!this.checkFeatureGeometryType(selectorFeatures[0])) {
            return;
          }
          if (
            selectorFeatures.length > 1 &&
            this.editLayer !=
              this.hsMapService.getLayerForFeature(data.feature, this.app) &&
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
                    this.app
                  ),
                  this.HsLanguageService.getTranslation(
                    'DRAW.featureEditor.onlyOneSplitLine',
                    undefined,
                    this.app
                  ),
                  {
                    toastStyleClasses: 'bg-info text-light',
                  },
                  this.app
                );
              } else {
                //Remove lastly selected feature.
                //TODO: Feature is removed from selector properly but its style is not refreshed(looks like its still selected)
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
        }
      });
  }

  ngOnDestroy() {
    this.hsMapService.loaded(this.app).then((map) => {
      map.removeLayer(this.editLayer);
      this.setType(this.appRef.type);
      //Timeout necessary because setType triggers async deactivateDrawing
      //HsDrawService.draw needs to be null in order to change draw soruce properly
      setTimeout(() => {
        if (this.appRef.previouslySelected) {
          this.appRef.selectedLayer = this.appRef.previouslySelected;
          this.HsDrawService.changeDrawSource(this.app);
        } else {
          this.HsDrawService.fillDrawableLayers(this.app);
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
          this.app
        ),
        'Only polygon geometry can be edited',
        undefined,
        this.app
      );
      this.resetState();
    }
    return isValidType;
  }

  /**
   * Selects geometry operation (one of editOptions)
   */
  selectGeomOperation(option): void {
    const features =
      this.HsQueryVectorService.apps[this.app].selector.getFeatures();
    this.selectedType = option;

    if (this.appRef.draw) {
      const drawTypeRequired = option == 'split' ? 'LineString' : 'Polygon';
      if (this.appRef.type != drawTypeRequired) {
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

  //Deselects multi selection. Only one feature can be edited at the time
  //Index can specify whitch feature to preserve in selection
  deselectMultiple(index = 1): void {
    this.hsToastService.createToastPopupMessage(
      this.HsLanguageService.getTranslation('DRAW.featureEditor.featureEditor'),
      this.HsLanguageService.getTranslation(
        'DRAW.featureEditor.onlyOneFeatureToEdit',
        undefined,
        this.app
      ),
      {
        toastStyleClasses: 'bg-info text-light',
      },
      this.app
    );
    setTimeout(() => {
      try {
        const feature = this.HsQueryBaseService.get(this.app)
          .selector.getFeatures()
          .getArray()[index];
        this.HsQueryBaseService.apps[this.app].clear('features');
        this.HsQueryBaseService.apps[this.app].selector.getFeatures().clear();
        this.HsQueryBaseService.apps[this.app].selector
          .getFeatures()
          .push(feature);
        this.HsQueryVectorService.createFeatureAttributeList(this.app);
      } catch (error) {
        console.error(error);
      }
    });
  }

  //Custom onDrawEnd callback preventing HsQueryBaseService.clearData
  onDrawEnd(e): void {
    setTimeout(() => {
      if (this.selectedType == 'split') {
        const features = this.editLayer.getSource().getFeatures();
        if (features.length > 1) {
          this.HsQueryVectorService.removeFeature(features[0], this.app);

          this.hsToastService.createToastPopupMessage(
            this.HsLanguageService.getTranslation(
              'DRAW.featureEditor.featureEditor',
              undefined,
              this.app
            ),
            this.HsLanguageService.getTranslation(
              'DRAW.featureEditor.onlyOneSplitLine',
              undefined,
              this.app
            ),
            {
              toastStyleClasses: 'bg-info text-light',
            },
            this.app
          );
        }
      }

      this.HsDrawService.addFeatureToSelector(e.feature, this.app);
    });
  }

  selectionMenuToggled(): void {
    this.setType(this.appRef.type);
    this.editLayer.getSource().clear();
  }

  setType(what): void {
    this.appRef.selectedLayer = this.editLayer;

    this.HsQueryBaseService.get(this.app).selector.setActive(
      what === this.appRef.type
    );
    this.appRef.modify.setActive(what === this.appRef.type);

    const type = this.HsDrawService.setType(what, this.app);
    if (type) {
      this.HsDrawService.activateDrawing(
        {onDrawEnd: (e) => this.onDrawEnd(e)},
        this.app
      );
    }
    if (this.selectedType == 'split' && this.features.length > 1) {
      this.deselectMultiple(0);
    }
  }

  translateString(module: string, text: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

  //Modifiy firstly selected features with the output of polygonClipping
  setCoordinatesToFirstFeature(coords): void {
    this.features[0].feature.getGeometry().setCoordinates(coords[0], 'XY');
  }

  get features() {
    return this.HsQueryBaseService.apps[this.app].features;
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
        }
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

    //TYPE SPECIFFIC ACTION
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
          this.app
        ),
        this.HsLanguageService.getTranslation(
          'DRAW.featureEditor.noIntersection',
          undefined,
          this.app
        ),
        {
          toastStyleClasses: 'bg-warning text-light',
        },
        this.app
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
          this.app
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
        this.app
      );
      const feature = new Feature(
        Object.assign(properties, {geometry: new Polygon(c)})
      );

      layer.getSource().addFeature(feature);
    }
    for (const feature of this.features) {
      this.HsQueryVectorService.removeFeature(feature.feature, this.app);
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
        this.app
      );

      for (const geom of newGeom) {
        const feature = new Feature(new Polygon(geom));

        layer.getSource().addFeature(feature);
      }

      for (const feature of this.features) {
        this.HsQueryVectorService.removeFeature(feature.feature, this.app);
      }
    }
    this.resetState();
  }

  resetState() {
    this.editLayer.getSource().clear();
    this.setType(this.HsDrawService.get(this.app).type);
    this.HsQueryBaseService.apps[this.app].clear('features');
    this.HsQueryBaseService.get(this.app).selector.getFeatures().clear();
    this.HsQueryBaseService.get(this.app).selector.setActive(true);
  }
}
