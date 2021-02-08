import {Component, Input, OnInit} from '@angular/core';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerManagerWmstService} from '../layermanager-wmst.service';

@Component({
  selector: 'hs-layermanager-time-editor',
  templateUrl: 'layermanager-time-editor.component.html',
})
export class HsLayerManagerTimeEditorComponent implements OnInit {
  @Input() layer: HsLayerDescriptor;
  timeLayerConfig;
  currentTime;
  currentTimeIdx: number;
  availableTimes: Array<any>;

  constructor(
    public hsLayerManagerWmstService: HsLayerManagerWmstService,
    public hsEventBusService: HsEventBusService
  ) {
    this.hsEventBusService.owsCapabilitiesReceived.subscribe(
      ({type, response}) => {
        console.log('received in time');
        if (type !== 'WMS' && type !== 'WMTS') {
          return;
        }
        this.availableTimes = this.hsLayerManagerWmstService.getAvailableTimes(
          response,
          type
        );
        this.currentTimeIdx =
          this.availableTimes.indexOf(this.currentTime) ??
          this.availableTimes[0];
      }
    );
  }

  ngOnInit(): void {
    this.timeLayerConfig = this.layer.layer.get('dimensions').time;
    this.currentTime = this.timeLayerConfig.default ?? null;
  }

  previousTime(): void {
    if (this.currentTimeIdx > 0) {
      this.currentTime = this.availableTimes[--this.currentTimeIdx];
    }
  }

  followingTime(): void {
    if (this.currentTimeIdx < this.availableTimes.length - 2) {
      this.currentTime = this.availableTimes[++this.currentTimeIdx];
    }
  }
}
