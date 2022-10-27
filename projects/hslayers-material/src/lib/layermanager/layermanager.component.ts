import {BehaviorSubject} from 'rxjs';
import {Component, Injectable, Input} from '@angular/core';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {SelectionModel} from '@angular/cdk/collections';

import {
  HsConfig,
  HsCoreService,
  HsDialogContainerService,
  HsEventBusService,
  HsLanguageService,
  HsLayerDescriptor,
  HsLayerListService,
  HsLayerManagerComponent,
  HsLayerManagerService,
  HsLayerSynchronizerService,
  HsLayerUtilsService,
  HsLayoutService,
  HsMapService,
  HsSidebarService,
  HsUtilsService,
} from 'hslayers-ng';

class HsLayerNode {
  name: string;
  children?: HsLayerNode[];
  layer?: HsLayerDescriptor;
}

class HsLayerFlatNode {
  name: string;
  level: number;
  expandable: boolean;
  layer?: HsLayerDescriptor;
}

@Injectable({
  providedIn: 'root',
})
export class HsLayerDatabase {
  dataChange = new BehaviorSubject<HsLayerNode[]>([]);
  @Input() app = 'default';
  get data(): HsLayerNode[] {
    return this.dataChange.value;
  }

  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayerManagerService: HsLayerManagerService
  ) {
    const data = this.buildLayerTree(
      this.HsLayerManagerService.get(this.app).data
    );
    this.dataChange.next(data);

    this.HsEventBusService.layerManagerUpdates.subscribe(() => {
      const data = this.buildLayerTree(
        this.HsLayerManagerService.get(this.app).data
      );
      this.dataChange.next(data);
    });
  }

  layerToNode(layer: HsLayerDescriptor): HsLayerNode {
    return {
      name: layer.title,
      layer,
      // layer: layer,
    };
  }

  folderToNode(folder: any): HsLayerNode {
    return {
      name: folder.name,
      children: [
        ...folder.sub_folders?.map(this.folderToNode),
        ...folder.layers?.map(this.layerToNode),
      ],
    };
  }

  buildLayerTree(data): HsLayerNode[] {
    return [
      {
        name: 'Baselayers',
        children: data.baselayers?.map(this.layerToNode),
      },
      {
        name: 'Terrain layers',
        children: data.terrainlayers?.map(this.layerToNode),
      },
      {
        name: 'Box layers',
        children: data.box_layers?.map(this.layerToNode),
      },
      {
        name: 'Map content',
        children: [
          ...data.layers?.map(this.layerToNode),
          ...data.folders?.sub_folders?.map(this.folderToNode),
          ...data.folders?.layers?.map(this.layerToNode),
        ],
      },
    ];
  }
}

@Component({
  selector: 'hs-mat-layer-manager',
  templateUrl: './layermanager.html',
  providers: [HsLayerDatabase],
})
export class HsMatLayerManagerComponent extends HsLayerManagerComponent {
  app = 'default';
  flatNodeMap = new Map<HsLayerFlatNode, HsLayerNode>();
  nestedNodeMap = new Map<HsLayerNode, HsLayerFlatNode>();
  selectedParent: HsLayerFlatNode | null = null;

  treeControl: FlatTreeControl<HsLayerFlatNode>;
  treeFlattener: MatTreeFlattener<HsLayerNode, HsLayerFlatNode>;
  dataSource: MatTreeFlatDataSource<HsLayerNode, HsLayerFlatNode>;

  checklistSelection = new SelectionModel<HsLayerFlatNode>(true);

  constructor(
    private _database: HsLayerDatabase,
    public HsLayerManagerService: HsLayerManagerService,
    HsCore: HsCoreService,
    HsUtilsService: HsUtilsService,
    HsLayerUtilsService: HsLayerUtilsService,
    HsMapService: HsMapService,
    HsLayoutService: HsLayoutService,
    HsLayerSynchronizerService: HsLayerSynchronizerService,
    HsEventBusService: HsEventBusService,
    HsDialogContainerService: HsDialogContainerService,
    HsLanguageService: HsLanguageService,
    HsConfig: HsConfig,
    HsLayerListService: HsLayerListService,
    HsSidebarService: HsSidebarService
  ) {
    super(
      HsCore,
      HsUtilsService,
      HsLayerUtilsService,
      HsMapService,
      HsLayerManagerService,
      HsLayoutService,
      HsLayerSynchronizerService,
      HsEventBusService,
      HsDialogContainerService,
      HsLanguageService,
      HsConfig,
      HsLayerListService,
      HsSidebarService
    );
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<HsLayerFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );

    _database.dataChange.subscribe((data) => {
      this.dataSource.data = data;
      this.checklistSelection.select(
        ...this.treeFlattener
          .flattenNodes(this.dataSource.data)
          .filter((node) => node.layer?.visible)
      );
    });

    this.checklistSelection.changed.subscribe((changes) => {
      changes.added
        .filter((node) => node.layer)
        .filter((node) => !node.layer.visible)
        .forEach((node) =>
          this.HsLayerManagerService.changeLayerVisibility(
            true,
            node.layer,
            this.app
          )
        );

      changes.removed
        .filter((node) => node.layer)
        .filter((node) => node.layer.visible)
        .forEach((node) =>
          this.HsLayerManagerService.changeLayerVisibility(
            false,
            node.layer,
            this.app
          )
        );
    });

    // this.dataSource.data = _database.data;
    // this.checklistSelection.select(...this.dataSource.data.filter(node => node.layer?.visible));
  }

  getLevel = (node: HsLayerFlatNode) => node.level;

  isExpandable = (node: HsLayerFlatNode) => node.expandable;

  getChildren = (node: HsLayerNode): HsLayerNode[] => node.children;

  // hasChild = (_: number, node: HsLayerNode) => !!node.children && node.children.length > 0;
  // hasChild = (_: number, node: HsLayerNode) => node.children?.length > 0;
  hasChild = (_: number, _nodeData: HsLayerFlatNode) => _nodeData.expandable;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: HsLayerNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    // TODO: Might need a different identifier other than the node `name`
    const flatNode =
      existingNode && existingNode.name === node.name
        ? existingNode
        : new HsLayerFlatNode();
    flatNode.name = node.name;
    flatNode.layer = node.layer;
    flatNode.level = level;
    flatNode.expandable = !!node.children?.length;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: HsLayerFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: HsLayerFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some((child) =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the layer item selection. Select/deselect all the descendants node */
  layerNodeSelectionToggle(node: HsLayerFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach((child) => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf layer item selection. Check all the parents to see if they changed */
  layerLeafNodeSelectionToggle(node: HsLayerFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: HsLayerFlatNode): void {
    let parent: HsLayerFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: HsLayerFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: HsLayerFlatNode): HsLayerFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }
}
