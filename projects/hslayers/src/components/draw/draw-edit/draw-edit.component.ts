import {Component} from '@angular/core';

import * as polygonClipping from 'polygon-clipping';
import lineOffset from '@turf/line-offset';

import Feature from 'ol/Feature';
import MultiPolygon from 'ol/geom/MultiPolygon';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import {GeoJSON} from 'ol/format';
import {Vector} from 'ol/source';

import {HsDrawService} from '../draw.service';
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
export class DrawEditComponent {
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
    public hsMapService: HsMapService,
    public hsToastService: HsToastService
  ) {
    this.hsMapService.loaded().then((map) => {
      map.addLayer(this.editLayer);
    });
  }

  ngOnDestroy() {
    this.hsMapService.loaded().then((map) => {
      map.removeLayer(this.editLayer);
      this.setType(this.HsDrawService.type);
    });
  }

  selectModification(option): void {
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
      this.deselectMultiple();
    }
  }

  //Deselects multi selection. Only one feature can be edited at the time
  deselectMultiple(): void {
    setTimeout(() => {
      const feature = this.HsQueryBaseService.data.features[0].feature;
      this.HsQueryBaseService.clearData('features');
      this.HsQueryBaseService.selector.getFeatures().clear();
      this.HsQueryBaseService.selector.getFeatures().push(feature);
      this.HsQueryVectorService.createFeatureAttributeList();
    });
  }

  //Custom onDrawEnd callback preventing HsQueryBaseService.clearData
  onDrawEnd(e): void {
    setTimeout(() => {
      if (this.selectedType == 'split') {
        const features = this.editLayer.getSource().getFeatures();
        if (features.length > 1) {
          this.HsQueryVectorService.removeFeature(features[0]);
        }

        this.hsToastService.createToastPopupMessage(
          this.HsLanguageService.getTranslation(
            'DRAW.featureEditor.featureEditor'
          ),
          this.HsLanguageService.getTranslation(
            'DRAW.featureEditor.onlyOneSplitLine'
          ),
          {
            toastStyleClasses: 'bg-info text-light',
          }
        );
      }

      this.HsQueryBaseService.clearData('features');
      this.HsQueryBaseService.selector.getFeatures().push(e.feature);
      this.HsQueryVectorService.createFeatureAttributeList();
    });
  }

  selectionMenuToggled(): void {
    this.setType(this.HsDrawService.type);
  }

  setType(what): void {
    this.HsDrawService.selectedLayer = this.editLayer;
    if (what === this.HsDrawService.type) {
      this.HsQueryBaseService.selector.setActive(true);
    }
    const type = this.HsDrawService.setType(what);
    if (type) {
      this.selectedFeature = this.HsQueryBaseService.data.features[0].feature; //store feature selected for modification, might not be neecessary
      this.HsQueryBaseService.selector.setActive(false);
      this.HsDrawService.activateDrawing({onDrawEnd: (e) => this.onDrawEnd(e)});
    }
  }

  translateString(module: string, text: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

  //Modifiy firstly selected features with the output of polygonClipping
  setCoordinatesToFirstFeature(coords): void {
    this.HsQueryBaseService.data.features[0].feature
      .getGeometry()
      .setCoordinates(coords[0], 'XY');
    console.log(this.HsQueryBaseService.data.features[0]);
  }

  modify(type): void | boolean {
    const features = [];
    const editCoords = [];

    this.HsQueryBaseService.data.features.forEach((feature, idx) => {
      if ((type == 'difference' && idx < 2) || type != 'difference') {
        features.push(feature.feature.clone());
      }
    });

    for (const index in features) {
      editCoords[index] = features[index].getGeometry().getCoordinates();
    }

    if (type === 'split') {
      const thickLine = [];
      const splittingLine = this.editLayer.getSource().getFeatures()[0];
      const parser = new GeoJSON();
      const GeoJSONline = parser.writeFeatureObject(splittingLine);
      thickLine[0] = lineOffset(GeoJSONline, 0.1, {units: 'degrees'});
      thickLine[1] = lineOffset(GeoJSONline, -0.1, {units: 'degrees'});

      const polyCoords = [
        ...thickLine[0].geometry.coordinates,
        ...thickLine[1].geometry.coordinates.reverse(),
      ];
      polyCoords.push(polyCoords[0]);
      editCoords[1] = [[polyCoords]];
    }

    const newGeom = polygonClipping[type == 'split' ? 'difference' : type](
      editCoords[0],
      ...editCoords.slice(1)
    );
    //TYPE SPECIFFIC ACTION
    this[type](newGeom);
  }

  intersection(newGeom): void {
    if (newGeom.length > 0) {
      this.setCoordinatesToFirstFeature(newGeom);
      this.resetState();
    } else {
      this.hsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation(
          'DRAW.featureEditor.featureEditor'
        ),
        this.HsLanguageService.getTranslation(
          'DRAW.featureEditor.noIntersection'
        ),
        {
          toastStyleClasses: 'bg-warning text-light',
        }
      );
    }
  }

  union(newGeom): void {
    this.setCoordinatesToFirstFeature(newGeom);
    for (const index in this.HsQueryBaseService.data.features) {
      //Remove all but the first (edited) features
      // if (parseInt(index) > 0) {
      //   this.HsQueryVectorService.removeFeature(
      //     this.HsQueryBaseService.data.features[index].feature
      //   );
      // }
    }
    this.resetState();
  }

  split(newGeom): void {
    for (const geom of newGeom) {
      const layer = this.hsMapService.getLayerForFeature(
        this.HsQueryBaseService.data.features[0].feature
      );
      const polygon = new Polygon(geom);
      const feature = new Feature(polygon);

      layer.getSource().addFeature(feature);
    }
    for (const feature of this.HsQueryBaseService.data.features) {
      this.HsQueryVectorService.removeFeature(feature.feature);
    }
    this.resetState();
  }

  difference(newGeom: Array<any>): void {
    if (newGeom.length === 1) {
      this.setCoordinatesToFirstFeature(newGeom);
    } else {
      const layer = this.hsMapService.getLayerForFeature(
        this.HsQueryBaseService.data.features[0].feature
      );

      for (const geom of newGeom) {
        const polygon = new Polygon(geom);
        const feature = new Feature(polygon);

        layer.getSource().addFeature(feature);
      }

      for (const feature of this.HsQueryBaseService.data.features) {
        this.HsQueryVectorService.removeFeature(feature.feature);
      }
    }
    this.resetState();
  }

  resetState() {
    this.editLayer.getSource().clear();
    this.setType(this.HsDrawService.type);
    this.HsQueryBaseService.clearData('features');
    this.HsQueryBaseService.selector.getFeatures().clear();
    this.HsQueryBaseService.selector.setActive(true);
  }
}
