import {
  Directive,
  ElementRef,
  HostListener,
  Inject,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import {HsConfig} from '../../config.service';
@Directive({
  selector: '[hs-draggable]',
})
export class HsDragDirective {
  original_container: any;
  element: any;
  keyDownlistener: any = null;
  keyUplistener: any = null;
  keyMovelistener: any = null;
  unpinned = false;
  drag_panel: any;
  startX = 0;
  startY = 0;
  x = 0;
  y = 0;
  orig_left: any;
  orig_top: any;
  @HostListener('mouseup') onMouseUp() {
    this.mouseUp();
  }
  @HostListener('mousedown') onMouseDown() {
    this.mouseDown();
  }
  @HostListener('mousemove') onMouseMove() {
    this.mouseMove();
  }
  constructor(
    public HsConfig: HsConfig,
    private el: ElementRef,
    private renderer: Renderer2,
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.element = this.el.nativeElement;
    if (
      (this.isPanel() && this.HsConfig.draggable_windows === undefined) ||
      this.HsConfig.draggable_windows == false
    ) {
      return;
    } else {
      this.element.style.cursor = 'pointer';
      this.element.style.display = 'block';
      this.drag_panel = this.element;

      const header = this.element.querySelector('.card-header');
      const closeButton = document.createElement(
        '<button class="but-title-sm"><span class="icon-share" aria-hidden="true"></span><span class="sr-only">Unpin</span><button>'
      );
      closeButton.onclick = () => {
        this.unpinned = true;
        header.style.cursor = 'move';
      };
      this.renderer.appendChild(header, closeButton);
    }
  }

  isPanel(): boolean {
    //return angular.isUndefined(attr.iswindow) || attr.iswindow == 'true';
    return true;
  }
  mouseUp(): void {
    if (!this.keyUplistener) {
      this.keyUplistener = this.renderer.listen(window, 'keyup', () => {
        this.keyDownlistener = null;
        this.keyMovelistener = null;
      });
    }
    this.keyUplistener = null;
  }
  mouseMove(): void {
    if (!this.keyMovelistener) {
      this.keyMovelistener = this.renderer.listen(
        window,
        'keymove',
        (event) => {
          this.y = this.orig_top + event.pageY - this.startY;
          this.x = this.orig_left + event.pageX - this.startX;
          // if (scope[attr.hsDraggableOnmove]) {
          //   scope[attr.hsDraggableOnmove](
          this.x +
            parseFloat(
              getComputedStyle(this.element, null).width.replace('px', '')
            ) /
              2,
            this.y +
              parseFloat(
                getComputedStyle(this.element, null).height.replace('px', '')
              ) /
                2;
          //   );
          // }
          this.element.style.top = this.y + 'px';
          this.element.style.left = this.x + 'px';
        }
      );
    }
  }
  mouseDown(): any {
    if (!this.keyDownlistener) {
      this.keyDownlistener = this.renderer.listen(
        window,
        'keydown',
        (event) => {
          if (!this.unpinned && this.isPanel()) {
            return;
          }
          // Prevent default dragging of selected content
          event.preventDefault();
          if (event.offsetY > 37) {
            return;
          }
          const rect = this.element.getBoundingClientRect();
          this.orig_left = rect.left + document.body.scrollLeft;
          this.orig_top = rect.top + document.body.scrollTop;
          this.startY = event.pageY;
          this.startX = event.pageX;
          if (this.element.parentElement != document.body) {
            this.element.style.width = getComputedStyle(
              this.element,
              null
            ).width;
            this.original_container = this.element.parentElement;
            document.body.appendChild(this.element);
            this.element.top = this.orig_top + 'px';
            this.element.left = this.orig_left + 'px';
            this.element.position = 'absolute';
          }
          // $document.on('mousemove', mousemove);
          // $document.on('mouseup', mouseup);
        }
      );
    }
  }
}
