import {AsyncPipe, NgClass} from '@angular/common';

import {BehaviorSubject} from 'rxjs';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {tap} from 'rxjs/operators';

import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

export function toArray(panels: string) {
  return panels.split(',');
}

@Component({
  selector: 'hs-panel-header',
  standalone: true,
  templateUrl: './panel-header.component.html',
  imports: [TranslateCustomPipe, NgbDropdownModule, NgClass, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panel-header.component.scss',
})
export class HsPanelHeaderComponent implements OnInit {
  @ViewChild('extraButtonsContainer', {static: true})
  extraButtons: ElementRef;
  active: string;
  private destroyRef = inject(DestroyRef);

  @Input() name: string;
  /**
   * Part of translation string which exists on 'translationModule' module
   * eg. COMPOSITIONS --\> which will be used for translation as 'translationModule'.COMPOSITIONS
   */
  @Input({transform: toArray}) panelTabs: string[];

  @Input() translationModule: string = 'PANEL_HEADER';

  @Output() tabSelected = new EventEmitter<string>();
  @Input() selectedTab$: BehaviorSubject<string>;

  constructor(
    public HsLayoutService: HsLayoutService,
    private hsLanguageService: HsLanguageService,
    private ElementRef: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (!this.selectedTab$) {
      this.selectedTab$ = new BehaviorSubject(this.panelTabs[0]);
    }
    this.hsLanguageService
      .getTranslator()
      .onLangChange.pipe(
        tap(() => {
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
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
   * Next value of activated tab to the BehaviorSubject
   */
  tabClicked(tab: string): void {
    this.selectedTab$.next(tab);
  }

  closePanel(): void {
    this.HsLayoutService.closePanel(this.name);
  }
}
