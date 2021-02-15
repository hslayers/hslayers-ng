import {Component, Input, OnInit} from '@angular/core';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerManagerWmstService} from '../layermanager-wmst.service';
import {HsLayoutService} from '../../layout/layout.service';

@Component({
  selector: 'hs-layermanager-time-editor',
  templateUrl: 'layermanager-time-editor.component.html',
})
export class HsLayerManagerTimeEditorComponent implements OnInit {
  @Input() layer: HsLayerDescriptor;
  currentTime;
  currentTimeIdx: number;
  availableTimes: Array<any>;
  selectVisible: boolean;
  timesInSync: boolean;

  constructor(
    public hsEventBusService: HsEventBusService,
    public hsLayerManagerWmstService: HsLayerManagerWmstService,
    public hsLayoutService: HsLayoutService
  ) {
    this.hsEventBusService.layerTimeChanges.subscribe(({layer, _}) => {
      if (this.availableTimes === undefined && this.layer.uid === layer.uid) {
        //this.timeLayerConfig = this.layer.layer.get('dimensions').time;
        this.availableTimes = layer.time.timePoints;
        this.currentTime = this.layer.time.default ?? this.availableTimes[0];
        this.currentTimeIdx = this.availableTimes.indexOf(this.currentTime);
      }
    });
  }

  ngOnInit(): void {
    this.selectVisible = false;
    this.timesInSync = false;
  }

  hasPreviousTime(): boolean {
    return this.availableTimes && this.currentTimeIdx > 0;
  }

  hasFollowingTime(): boolean {
    return (
      this.availableTimes &&
      this.currentTimeIdx < this.availableTimes.length - 2
    );
  }

  previousTime(): void {
    if (this.hasPreviousTime()) {
      this.currentTime = this.availableTimes[--this.currentTimeIdx];
      this.setLayerTime();
    }
    console.log(this.currentTimeIdx);
    console.log(this.currentTime);
  }

  followingTime(): void {
    if (this.hasFollowingTime()) {
      this.currentTime = this.availableTimes[++this.currentTimeIdx];
      this.setLayerTime();
    }
    console.log(this.currentTimeIdx);
    console.log(this.currentTime);
  }

  selectTime(evt: Event): void {
    this.currentTime = (evt.target as HTMLSelectElement).value;
    this.currentTimeIdx = this.availableTimes.indexOf(this.currentTime);
    this.setLayerTime();
    console.log(this.currentTimeIdx);
    console.log(this.currentTime);
  }

  setLayerTime(): void {
    setTimeout(() => {
      this.hsLayerManagerWmstService.setLayerTime(this.layer, this.currentTime);
    }, 100);
  }

  showTimeSelect(): void {
    this.selectVisible = true;
    this.hsLayoutService.contentWrapper
      .querySelector('.hs-lm-time-selector')
      .focus(); //TODO: not focusing, why?
  }

  hideTimeSelect(): void {
    this.selectVisible = false;
  }

  synchronizeTimes(): void {
    this.timesInSync = !this.timesInSync;
    throw new Error('Not implemented');
  }
}
