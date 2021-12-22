/**
 * Original code from https://github.com/Viglino/ol-ext/blob/master/src/control/Swipe.js
 */

import {Control} from 'ol/control';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {LayerListItem} from '../../../common/layer-shifting/layer-shifting.service';

/**
 * Initialization options for SwipeControl
 *  @param layers - layer to swipe
 *  @param rightLayer - layer to swipe on right side
 *  @param className - control class name
 *  @param position - position property of the swipe [0,1], default 0.5
 *  @param orientation - orientation property (vertical|horizontal), default vertical
 */
export type SwipeControlOptions = {
  layers?: LayerListItem[];
  rightLayers?: LayerListItem[];
  className?: string;
  position?: number;
  orientation?: string;
};

export class SwipeControl extends Control {
  options: SwipeControlOptions;
  layers: LayerListItem[];
  rightLayers: LayerListItem[];
  isMoving: boolean;
  constructor(options?: SwipeControlOptions) {
    const button = document.createElement('button');
    const element = document.createElement('div');
    element.className =
      (options?.className || 'ol-swipe') + ' ol-unselectable ol-control';
    element.appendChild(button);
    super({element: element});

    this.options = options || {};
    element.addEventListener('mousedown', this.move.bind(this));
    element.addEventListener('touchstart', this.move.bind(this));
    // An array of listener on layer postcompose
    this.precomposeRight = this.precomposeRight.bind(this);
    this.precomposeLeft = this.precomposeLeft.bind(this);
    this.postcompose = this.postcompose.bind(this);

    this.layers = [];
    this.rightLayers = [];
    if (options?.layers) {
      this.addLayers(options.layers);
    }
    if (options?.rightLayers) {
      this.addLayers(options.rightLayers, true);
    }

    this.on('propertychange', () => {
      if (this.getMap()) {
        try {
          this.getMap().renderSync();
        } catch (e) {
          console.error(e);
        }
      }
      if (this.get('orientation') === 'horizontal') {
        this.element.style.top = this.get('position') * 100 + '%';
        this.element.style.left = '';
      } else {
        if (this.get('orientation') !== 'vertical') {
          this.set('orientation', 'vertical');
        }
        this.element.style.left = this.get('position') * 100 + '%';
        this.element.style.top = '';
      }
      this.element.classList.remove('horizontal', 'vertical');
      this.element.classList.add(this.get('orientation'));
    });

    this.set('position', options?.position || 0.5);
    this.set('orientation', options?.orientation || 'vertical');
  }

  /**
   * Set the map instance the control associated with.
   * @param map - The map instance.
   */
  setTargetMap(map) {
    if (map) {
      this.setMap(map);
    }
    if (this.getMap()) {
      for (const l of this.layers) {
        this.disableEvents(l);
      }
      for (const l of this.rightLayers) {
        this.disableEvents(l, true);
      }
      try {
        this.getMap().renderSync();
      } catch (e) {
        //console.error(e);
      }
    }
  }

  private enableEvents(l: LayerListItem, right?: boolean): void {
    if (right) {
      (l.layer as any).on(['precompose', 'prerender'], this.precomposeRight);
    } else {
      (l.layer as any).on(['precompose', 'prerender'], this.precomposeLeft);
    }
    (l.layer as any).on(['postcompose', 'postrender'], this.postcompose);
  }

  private disableEvents(l: LayerListItem, right?: boolean): void {
    if (right) {
      (l.layer as any).un(['precompose', 'prerender'], this.precomposeRight);
    } else {
      (l.layer as any).un(['precompose', 'prerender'], this.precomposeLeft);
    }
    (l.layer as any).un(['postcompose', 'postrender'], this.postcompose);
  }

  private isLayerAdded(lyr: LayerListItem, right?: boolean) {
    const found = right
      ? this.rightLayers.find((l) => l.layer == lyr.layer)
      : this.layers.find((l) => l.layer == lyr.layer);
    if (!found) {
      return -1;
    } else {
      const index = right
        ? this.rightLayers.indexOf(found)
        : this.layers.indexOf(found);
      return index;
    }
  }

  /** Add layers array to clip
   *	@param layers - to clip
   *	@param right - layers in the right part of the map, default left.
   */
  addLayers(layers: LayerListItem[], right?: boolean): void {
    if (!(layers instanceof Array)) {
      layers = [layers];
    }
    for (const l of layers) {
      this.addLayer(l, right);
    }
  }
  /** Add a layer to clip
   *	@param layer - to clip
   *	@param right - layer in the right part of the map, default left.
   */
  addLayer(layer: LayerListItem, right?: boolean) {
    if (this.isLayerAdded(layer, right) < 0) {
      right ? this.rightLayers.push(layer) : this.layers.push(layer);
      if (this.getMap()) {
        this.enableEvents(layer, right);
        try {
          this.getMap().renderSync();
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
  /**
   * Sets available layer events to enabled/disabled
   * @param enabled - (Optional) If true, map swipe control is enabled, else it is removed
   */
  setEvents(enabled?: boolean): void {
    this.layers.forEach((l) => {
      enabled ? this.enableEvents(l) : this.disableEvents(l);
    });
    this.rightLayers.forEach((l) => {
      enabled ? this.enableEvents(l, true) : this.disableEvents(l, true);
    });
  }

  /** Remove all layers
   */
  removeLayers() {
    this.layers.forEach((l) => {
      this.removeLayer(l);
    });
    this.rightLayers.forEach((l) => {
      this.removeLayer(l, true);
    });
  }

  /** Remove a specific layer from swipe control completely
   */
  removeCompletely(layerToRm: Layer<Source>): void {
    let layerFound;
    layerFound = this.layers.find((l) => l.layer == layerToRm);
    if (layerFound) {
      this.removeLayer(layerFound);
    } else {
      layerFound = this.rightLayers.find((l) => l.layer == layerToRm);
      if (layerFound) {
        this.removeLayer(layerFound, true);
      }
    }
  }

  /** Remove a layer to clip
   *	@param layer - to clip
   *  @param right - layer from right side to clip
   */
  removeLayer(layer: LayerListItem, right?: boolean) {
    const k = this.isLayerAdded(layer, right);
    if (k > -1) {
      this.disableEvents(layer, right);
      right ? this.rightLayers.splice(k, 1) : this.layers.splice(k, 1);
    }
    if (this.getMap()) {
      try {
        this.getMap().renderSync();
      } catch (e) {
        console.error(e);
      }
    }
  }

  private move(e) {
    let l: number;
    switch (e.type) {
      case 'touchcancel':
      case 'touchend':
      case 'mouseup': {
        this.isMoving = false;
        [
          'mouseup',
          'mousemove',
          'touchend',
          'touchcancel',
          'touchmove',
        ].forEach((eventName) => {
          document.removeEventListener(eventName, this.move);
        });
        break;
      }
      case 'mousedown':
      case 'touchstart': {
        this.isMoving = true;
        [
          'mouseup',
          'mousemove',
          'touchend',
          'touchcancel',
          'touchmove',
        ].forEach((eventName) => {
          document.addEventListener(eventName, this.move.bind(this));
        });
      }
      // fallthrough
      case 'mousemove':
      case 'touchmove': {
        if (this.isMoving) {
          if (this.get('orientation') === 'vertical') {
            let pageX =
              e.pageX ||
              (e.touches && e.touches.length && e.touches[0].pageX) ||
              (e.changedTouches &&
                e.changedTouches.length &&
                e.changedTouches[0].pageX);
            if (!pageX) {
              break;
            }
            pageX -=
              this.getMap().getTargetElement().getBoundingClientRect().left +
              window.pageXOffset -
              document.documentElement.clientLeft;

            l = this.getMap().getSize()[0];
            const w = l - Math.min(Math.max(0, l - pageX), l);
            l = w / l;
            this.set('position', l);
            this.dispatchEvent('moving');
          } else {
            let pageY =
              e.pageY ||
              (e.touches && e.touches.length && e.touches[0].pageY) ||
              (e.changedTouches &&
                e.changedTouches.length &&
                e.changedTouches[0].pageY);
            if (!pageY) {
              break;
            }
            pageY -=
              this.getMap().getTargetElement().getBoundingClientRect().top +
              window.pageYOffset -
              document.documentElement.clientTop;

            l = this.getMap().getSize()[1];
            const h = l - Math.min(Math.max(0, l - pageY), l);
            l = h / l;
            this.set('position', l);
            this.dispatchEvent('moving');
          }
        }
        break;
      }
      default:
        break;
    }
  }

  private drawRect(e, pts) {
    const tr = e.inversePixelTransform;
    if (tr) {
      const r = [
        [pts[0][0], pts[0][1]],
        [pts[0][0], pts[1][1]],
        [pts[1][0], pts[1][1]],
        [pts[1][0], pts[0][1]],
        [pts[0][0], pts[0][1]],
      ];
      r.forEach((pt, i) => {
        pt = [
          pt[0] * tr[0] - pt[1] * tr[1] + tr[4],
          -pt[0] * tr[2] + pt[1] * tr[3] + tr[5],
        ];
        if (!i) {
          e.context.moveTo(pt[0], pt[1]);
        } else {
          e.context.lineTo(pt[0], pt[1]);
        }
      });
    } else {
      const ratio = e.frameState.pixelRatio;
      e.context.rect(
        pts[0][0] * ratio,
        pts[0][1] * ratio,
        pts[1][0] * ratio,
        pts[1][1] * ratio
      );
    }
  }

  precomposeLeft(e) {
    const size = e.frameState.size;
    const pts = [
      [0, 0],
      [size[0], size[1]],
    ];
    if (this.get('orientation') === 'vertical') {
      pts[1] = [size[0] * this.get('position'), size[1]];
    } else {
      pts[1] = [size[0], size[1] * this.get('position')];
    }
    this.precompose(e, pts);
  }

  precompose(e, pts): void {
    const ctx = e.context;
    ctx.save();
    ctx.beginPath();
    this.drawRect(e, pts);
    ctx.clip();
  }

  precomposeRight(e) {
    const size = e.frameState.size;
    const pts = [
      [0, 0],
      [size[0], size[1]],
    ];
    if (this.get('orientation') === 'vertical') {
      pts[0] = [size[0] * this.get('position'), 0];
    } else {
      pts[0] = [0, size[1] * this.get('position')];
    }
    this.precompose(e, pts);
  }

  postcompose(e) {
    // restore context when decluttering is done (ol>=6)
    // https://github.com/openlayers/openlayers/issues/10096
    if (
      e.target.getClassName &&
      e.target.getClassName() !== 'ol-layer' &&
      e.target.get('declutter')
    ) {
      setTimeout(() => {
        e.context.restore();
      }, 0);
    } else {
      e.context.restore();
    }
  }
}
