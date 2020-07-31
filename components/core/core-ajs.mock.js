import * as angular from 'angular';
import {Subject} from 'rxjs';

export default angular
  .module('hs.core', [])
  .service('HsCore', function () {})
  .service('HsEventBusService', function () {
    this.mainPanelChanges = new Subject();
    this.layoutResizes = new Subject();
    this.sizeChanges = new Subject();
    this.mapResets = new Subject();
    this.compositionEdits = new Subject();
    this.compositionLoadStarts = new Subject();
    this.compositionDeletes = new Subject();
    this.mainPanelChanges = new Subject();
    this.mapExtentChanges = new Subject();
    this.olMapLoads = new Subject();
  });
