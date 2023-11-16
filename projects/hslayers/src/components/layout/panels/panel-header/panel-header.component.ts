import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import {HsLanguageService} from '../../../language/language.service';
import {HsLayoutService} from '../../layout.service';
import {NgForOf, NgIf} from '@angular/common';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {Subject} from 'rxjs';
import {TranslateCustomPipe} from '../../../language/translate-custom.pipe';
import {takeUntil, tap} from 'rxjs/operators';

export function toArray(panels: string) {
  return panels.split(',');
}

@Component({
  selector: 'hs-panel-header',
  standalone: true,
  templateUrl: './panel-header.component.html',
  imports: [TranslateCustomPipe, NgbDropdownModule, NgForOf, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        border-bottom: 1px solid #dee2e6;
        display: block;
      }

      a.nav-link {
        min-width: 6rem;
        text-align: center;
      }
    `,
  ],
})
export class HsPanelHeaderComponent implements OnDestroy, OnInit {
  @ViewChild('extraButtonsContainer') extraButtons: ElementRef;
  active: string;
  private end = new Subject<void>();

  @Input() name: string;
  /**
   * Part of translation string which exists on PANEL_HEADER module
   * eg. COMPOSITIONS -> which will used for translation as as PANEL_HEADER.COMPOSITIONS
   */
  @Input({transform: toArray}) panelTabs: string[];

  @Output() tabSelected = new EventEmitter<string>();

  constructor(
    public HsLayoutService: HsLayoutService,
    private hsLanguageService: HsLanguageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit() {
    this.active = this.panelTabs[0];
    this.hsLanguageService
      .getTranslator()
      .onLangChange.pipe(
        takeUntil(this.end),
        tap(() => {
          this.cdr.markForCheck();
        }),
      )
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .subscribe(() => {});
  }

  /**
   * Check if there is some content in extraButtonsContainer element
   */
  hasExtraButtons(): boolean {
    return this.extraButtons?.nativeElement.childElementCount > 0;
  }
  /**
   * Emit add event to trigger bind action
   */
  tabClicked(tab: string): void {
    this.active = tab;
    this.tabSelected.emit(tab);
  }

  closePanel(): void {
    this.HsLayoutService.closePanel(this.name);
  }
}
