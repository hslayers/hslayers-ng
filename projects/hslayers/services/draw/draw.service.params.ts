import {Collection, Feature} from 'ol';
import {DragBox, Draw, Modify, Snap} from 'ol/interaction';
import {EventsKey} from 'ol/events';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

export class HsDrawServiceParams {
  drawableLayers: Array<Layer<Source>> = [];
  /**
   * Drawable layers available on Layman not currently added to map
   */
  drawableLaymanLayers: Array<any> = [];
  /**
   * Whether there are some available drawable layers either visible in map or on server
   */
  drawableLayersAvailable = false;
  /**
   * Whether there are some drawable layers in a map
   */
  hasSomeDrawables = false;
  /**
   * Whether there are multiple drawable layers in a map
   */
  moreThanOneDrawable = false;
  draw: Draw;
  modify: Modify;

  boxSelection: DragBox;
  boxSelectionActive = false;
  /**
   * Snap interaction
   */
  snap: Snap;
  snapActive = false;
  snapSource: VectorSource;
  snapLayer: VectorLayer<Feature>;
  /**
   * String of type GeometryType
   */
  type: 'Point' | 'Polygon' | 'LineString' | 'Circle';
  selectedLayer: VectorLayer<Feature>;
  tmpDrawLayer: any;
  source: VectorSource;
  drawActive = false;
  selectedFeatures: any = new Collection();
  toggleSelectionString = 'selectAllFeatures';
  onSelected: any;
  currentStyle: any;
  /**
   * Toggles toolbar button 'Draw' class
   */
  highlightDrawButton = false;
  onDeselected: any;
  laymanEndpoint: any;
  previouslySelected: any;
  isAuthenticated: boolean;
  onlyMine = true;
  addedLayersRemoved = false;
  eventHandlers: EventsKey[] = [];

  public drawingLayerChanges: Subject<{
    layer: Layer<Source>;
    source: VectorSource;
  }> = new Subject();

  layerMetadataDialog: Subject<void> = new Subject();

  /**
   * Layer being loaded from layman (endpoint url pending)
   */
  pendingLayers = [];

  requiredSymbolizer = {
    Point: ['Point'],
    Polygon: ['Fill', 'Line', 'Polygon'],
    LineString: ['Line'],
    Circle: ['Fill', 'Line', 'Polygon'],
  };
}
