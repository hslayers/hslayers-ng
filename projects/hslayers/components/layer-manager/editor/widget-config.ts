import {Type} from '@angular/core';

import {HsClusterWidgetComponent} from '../widgets/cluster-widget.component';
import {HsExtentWidgetComponent} from '../widgets/extent-widget/extent-widget.component';
import {HsIdwWidgetComponent} from '../widgets/idw-widget.component';
import {HsLayerEditorDimensionsComponent} from '../dimensions/layer-editor-dimensions.component';
import {HsLayerFolderWidgetComponent} from '../widgets/layer-folder-widget/layer-folder-widget.component';
import {HsLayerTypeSwitcherWidgetComponent} from '../widgets/layer-type-switcher-widget/layer-type-switcher-widget.component';
import {HsLegendWidgetComponent} from '../widgets/legend-widget.component';
import {HsMetadataWidgetComponent} from '../widgets/metadata-widget.component';
import {HsOpacityWidgetComponent} from '../widgets/opacity-widget.component';
import {HsScaleWidgetComponent} from '../widgets/scale-widget.component';
import {HsTypeWidgetComponent} from '../widgets/type-widget.component';
import {HsWmsSourceWidgetComponent} from '../widgets/wms-source-widget/wms-source-widget.component';

export interface LayerEditorWidget {
  name: string;
  component: Type<any>;
}

export const LAYER_EDITOR_WIDGETS: LayerEditorWidget[] = [
  {
    name: 'type',
    component: HsTypeWidgetComponent,
  },
  {
    name: 'metadata',
    component: HsMetadataWidgetComponent,
  },
  {
    name: 'extent',
    component: HsExtentWidgetComponent,
  },
  {
    name: 'cluster',
    component: HsClusterWidgetComponent,
  },
  {
    name: 'scale',
    component: HsScaleWidgetComponent,
  },
  {
    name: 'legend',
    component: HsLegendWidgetComponent,
  },
  {
    name: 'dimensions',
    component: HsLayerEditorDimensionsComponent,
  },
  {
    name: 'folder',
    component: HsLayerFolderWidgetComponent,
  },
  {
    name: 'opacity',
    component: HsOpacityWidgetComponent,
  },
  {
    name: 'idw',
    component: HsIdwWidgetComponent,
  },
  {
    name: 'wmsSource',
    component: HsWmsSourceWidgetComponent,
  },
  {
    name: 'layerType',
    component: HsLayerTypeSwitcherWidgetComponent,
  },
];
