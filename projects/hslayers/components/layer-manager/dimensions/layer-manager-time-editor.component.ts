import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsConfig} from 'hslayers-ng/config';
import {HsDimensionTimeService} from 'hslayers-ng/services/get-capabilities';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayoutService} from 'hslayers-ng/services/layout';

@Component({
  selector: 'hs-layer-manager-time-editor',
  templateUrl: 'layer-manager-time-editor.component.html',
})
export class HsLayerManagerTimeEditorComponent implements OnInit {
  @Input() layer: HsLayerDescriptor;

  availableTimes: Array<string>;
  availableTimesFetched = false;
  /**
   * ISO format time
   */
  currentTime: string;
  currentTimeIdx: number;
  hasPreviousTime = false;
  hasFollowingTime = false;
  @ViewChild('hstimeselector') selectElement;
  selectVisible: boolean;
  timeDisplayFormat = 'yyyy-MM-dd HH:mm:ss z';
  timesInSync: boolean;
  private destroyRef = inject(DestroyRef);

  constructor(
    public hsEventBusService: HsEventBusService,
    public hsDimensionTimeService: HsDimensionTimeService,
    public hsLayoutService: HsLayoutService,
    public hsConfig: HsConfig,
  ) {
    this.hsDimensionTimeService.layerTimeChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({layer: layerDescriptor, time}) => {
        if (this.layer.uid !== layerDescriptor.uid) {
          return;
        }
        if (!this.availableTimes) {
          this.fillAvailableTimes(layerDescriptor, time);
        }
        this.setCurrentTimeIfAvailable(time);
      });

    this.hsEventBusService.layerTimeSynchronizations
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({sync, time}) => {
        this.timesInSync = sync;
        if (sync) {
          this.hideTimeSelect();
          this.setCurrentTimeIfAvailable(time);
          if (this.currentTime) {
            this.setLayerTime();
          }
        }
      });
  }

  ngOnInit(): void {
    this.selectVisible = false;
    this.timesInSync = false;
    if (this.layer.time) {
      this.fillAvailableTimes(this.layer, undefined);
    }
  }

  /**
   * Sets hasPreviousTime and hasFollowingTime properties
   */
  checkPrevFollowTimesAvailability(): boolean {
    if (!this.availableTimes) {
      return;
    }
    if (this.currentTimeIdx > 0) {
      this.hasPreviousTime = true;
    } else {
      this.hasPreviousTime = false;
    }
    if (this.currentTimeIdx < this.availableTimes.length - 1) {
      this.hasFollowingTime = true;
    } else {
      this.hasFollowingTime = false;
    }
  }

  /**
   * Handler for the "prev" button click
   */
  previousTime(): void {
    if (!this.hasPreviousTime) {
      return;
    }
    this.currentTime = this.availableTimes[--this.currentTimeIdx];
    if (this.timesInSync) {
      this.hsEventBusService.layerTimeSynchronizations.next({
        sync: this.timesInSync,
        time: this.currentTime,
      });
    }
    this.setLayerTime();
    this.checkPrevFollowTimesAvailability();
  }

  /**
   * Handler for the "next" button click
   */
  followingTime(): void {
    if (!this.hasFollowingTime) {
      return;
    }
    this.currentTime = this.availableTimes[++this.currentTimeIdx];
    if (this.timesInSync) {
      this.hsEventBusService.layerTimeSynchronizations.next({
        sync: this.timesInSync,
        time: this.currentTime,
      });
    }
    this.setLayerTime();
    this.checkPrevFollowTimesAvailability();
  }

  /**
   * Handler for a time selection from the SELECT element
   */
  selectTime(): void {
    this.currentTimeIdx = this.availableTimes.indexOf(this.currentTime);
    if (this.timesInSync) {
      this.hsEventBusService.layerTimeSynchronizations.next({
        sync: this.timesInSync,
        time: this.currentTime,
      });
    }
    this.setLayerTime();
    this.checkPrevFollowTimesAvailability();
  }

  setCurrentTimeIfAvailable(time: string): void {
    if (this.availableTimes.includes(time)) {
      this.currentTime = time;
      this.currentTimeIdx = this.availableTimes.indexOf(time);
    } else {
      this.currentTime = null;
      this.currentTimeIdx = -1;
    }
    this.checkPrevFollowTimesAvailability();
  }

  /**
   * Set selected 'time' on the layer object
   */
  setLayerTime(): void {
    setTimeout(() => {
      this.hsDimensionTimeService.setLayerTime(this.layer, this.currentTime);
    }, 100);
  }

  showTimeSelect(): void {
    this.selectVisible = true;
    this.selectElement.nativeElement.focus(); //FIXME: this just refuse to work...
  }

  hideTimeSelect(): void {
    this.selectVisible = false;
  }

  synchronizeTimes(): void {
    this.timesInSync = !this.timesInSync;
    this.hsEventBusService.layerTimeSynchronizations.next({
      sync: this.timesInSync,
      time: this.currentTime,
    });
  }

  /**
   * This gets called from subscriber and also OnInit because
   * subscriber could have been set up after the event was broadcasted
   */
  private fillAvailableTimes(layer: HsLayerDescriptor, defaultTime: string) {
    this.availableTimes = layer.time.timePoints;
    this.setDateTimeFormatting();
    this.setCurrentTimeIfAvailable(defaultTime ?? this.layer.time.default);
    if (!this.currentTime && this.availableTimes.length > 0) {
      this.currentTime = this.availableTimes[0];
      this.currentTimeIdx = this.availableTimes.indexOf(this.currentTime);
    }
    this.availableTimesFetched = true;
    this.checkPrevFollowTimesAvailability();
  }

  private setDateTimeFormatting() {
    if (this.hsConfig.timeDisplayFormat) {
      this.timeDisplayFormat = this.hsConfig.timeDisplayFormat;
    } else if (
      this.availableTimes.every((time) => time.endsWith('00-00T00:00:00.000Z'))
    ) {
      this.timeDisplayFormat = 'yyyy';
    } else if (
      this.availableTimes.every((time) => time.endsWith('00T00:00:00.000Z'))
    ) {
      this.timeDisplayFormat = 'yyyy-MM';
    } else if (
      this.availableTimes.every((time) => time.endsWith('00:00:00.000Z'))
    ) {
      this.timeDisplayFormat = 'yyyy-MM-dd';
    } else if (this.availableTimes.every((time) => time.endsWith('00.000Z'))) {
      this.timeDisplayFormat = 'y-MM-dd HH:mm';
    } else if (this.availableTimes.every((time) => time.endsWith('000Z'))) {
      this.timeDisplayFormat = 'y-MM-dd HH:mm:ss';
    }
  }
}
