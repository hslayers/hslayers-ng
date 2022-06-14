import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';

import {
  HsDialogContainerService,
  HsLanguageService,
  HsLayerUtilsService,
} from 'hslayers-ng';

@Component({
  selector: 'hs-sketch-function',
  templateUrl: './sketch-function.component.html',
})
export class HsSketchFunctionComponent implements OnChanges {
  @Input() years: number[];
  @Input() data;
  @ViewChild('canvas') canvas: ElementRef;
  mouseDown: boolean;
  maxValue = 500;
  values: any = {};
  @Output() set = new EventEmitter<{
    [key: string]: number;
  }>(); 

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    private HsLanguageService: HsLanguageService,
    private elementRef: ElementRef
  ) {}

  ngOnChanges(): void {
    //this.visualize();
  }

  ngAfterViewInit() {
    this.canvas.nativeElement.addEventListener('mousemove', (e) =>
      this.mouseMoved(e)
    );
    this.canvas.nativeElement.addEventListener(
      'mousedown',
      (e) => (this.mouseDown = true)
    );
    this.canvas.nativeElement.addEventListener(
      'mouseup',
      (e) => (this.mouseDown = false)
    );
    this.redraw();
  }
  mouseMoved(e: any) {
    const canvas = this.canvas.nativeElement;
    if (this.mouseDown) {
      const year =
        this.years[
          Math.round(
            (e.offsetX / this.canvas.nativeElement.width) *
              (this.years.length - 1)
          )
        ];
      this.values[year] =
        ((canvas.height - e.offsetY) / this.canvas.nativeElement.height) *
        this.maxValue;
      this.redraw();
      this.set.emit(this.values);
    }
  }
  redraw() {
    const canvas = this.canvas.nativeElement;
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    ctx.beginPath();
    const year = Object.keys(this.values)[0];
    const x = this.scaleX(this.years.indexOf(parseInt(year)));
    const y = this.scaleY(this.values[year]);
    ctx.moveTo(x, y);
    for (const year of Object.keys(this.values)) {
      const x = this.scaleX(this.years.indexOf(parseInt(year)));
      const y = this.scaleY(this.values[year]);
      ctx.lineTo(x, y);
    }
    ctx.setLineDash([5, 9]);
    ctx.strokeStyle = '#4F6CFF';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  scaleY(y: number) {
    const canvas = this.canvas.nativeElement;
    return canvas.height - (y / this.maxValue) * canvas.height;
  }

  scaleX(x: number) {
    const canvas = this.canvas.nativeElement;
    return x * (canvas.width / (this.years.length - 1));
  }
}
