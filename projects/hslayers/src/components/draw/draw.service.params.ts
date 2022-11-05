import {Collection} from 'ol';
import {DragBox, Draw, Modify, Snap} from 'ol/interaction';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

export class HsDrawServiceParams {
  drawableLayers: Array<any> = [];
  drawableLaymanLayers: Array<any> = [];
  hasSomeDrawables = false;
  moreThenOneDrawable = false;
  draw: Draw;
  modify: Modify;

  boxSelection: DragBox;
  boxSelectionActive = false;
  //Snap interaction
  snap: Snap;
  snapActive = false;
  snapSource: VectorSource<Geometry>;
  snapLayer: VectorLayer<VectorSource<Geometry>>;

  type: 'Point' | 'Polygon' | 'LineString' | 'Circle'; //string of type GeometryType
  selectedLayer: VectorLayer<VectorSource<Geometry>>;
  tmpDrawLayer: any;
  source: VectorSource<Geometry>;
  drawActive = false;
  selectedFeatures: any = new Collection();
  toggleSelectionString = 'selectAllFeatures';
  onSelected: any;
  currentStyle: any;
  highlightDrawButton = false; // Toggles toolbar button 'Draw' class
  onDeselected: any;
  laymanEndpoint: any;
  previouslySelected: any;
  isAuthorized: boolean;
  onlyMine = true;
  addedLayersRemoved = false;

  public drawingLayerChanges: Subject<{
    layer: Layer<Source>;
    source: VectorSource<Geometry>;
  }> = new Subject();

  layerMetadataDialog: Subject<void> = new Subject();

  //Layer being loaded from layman (endpoint url pending)
  pendingLayers = [];

  requiredSymbolizer = {
    Point: ['Point'],
    Polygon: ['Fill', 'Line'],
    LineString: ['Line'],
    Circle: ['Fill', 'Line'],
  };
}
