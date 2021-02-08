import {Component, OnInit} from '@angular/core';
import {HsLayerManagerWmstService} from '../layermanager-wmst.service';

@Component({
  selector: 'hs-layermanager-time-editor',
  templateUrl: 'layermanager-time-editor.component.html',
})
export class HsLayerManagerTimeEditorComponent implements OnInit {
  constructor(public hsLayerManagerWmstService: HsLayerManagerWmstService) {}

  ngOnInit() {}
}
