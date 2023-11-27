import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import {NgClass, NgForOf} from '@angular/common';
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
  imports: [TranslateCustomPipe, NgbDropdownModule, NgForOf, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        border-bottom: 1px solid #dee2e6;
        display: block;
        height: calc(48px + 0.25rem);
        min-height: calc(48px + 0.25rem);
        position: relative;
        z-index: 10;
      }

      a.nav-link {
        min-width: 6rem;
        text-align: center;

        &:hover {
          border-bottom: 0;
        }
      }

      .nav-tabs > div + li:last-child a {
        cursor: default;
      }

      .extra-content {
        right: 0;
        transform: translateY(50%);
      }

      @media screen and (max-width: 767px) {
        .extra-content {
          padding: 0 1rem 0 1rem;
          justify-content: space-between;
          gap: 1rem;
        }
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
   * Part of translation string which exists on 'translationModule' module
   * eg. COMPOSITIONS -> which will used for translation as as 'translationModule'.COMPOSITIONS
   */
  @Input({transform: toArray}) panelTabs: string[];

  @Input() translationModule: string = 'PANEL_HEADER';

  @Output() tabSelected = new EventEmitter<string>();

  constructor(
    public HsLayoutService: HsLayoutService,
    private hsLanguageService: HsLanguageService,
    private ElementRef: ElementRef,
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
   * Check if there is some extra content
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
