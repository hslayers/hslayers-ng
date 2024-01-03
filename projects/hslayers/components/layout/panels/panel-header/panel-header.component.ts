import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';

import {BehaviorSubject, Subject} from 'rxjs';
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
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {takeUntil, tap} from 'rxjs/operators';

import {HsLanguageService} from 'hslayers-ng/components/language';
import {HsLayoutService} from '../../layout.service';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

export function toArray(panels: string) {
  return panels.split(',');
}

@Component({
  selector: 'hs-panel-header',
  standalone: true,
  templateUrl: './panel-header.component.html',
  imports: [
    TranslateCustomPipe,
    NgbDropdownModule,
    NgForOf,
    NgClass,
    AsyncPipe,
    NgIf,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panel-header.component.scss',
})
export class HsPanelHeaderComponent implements OnDestroy, OnInit {
  @ViewChild('extraButtonsContainer', {static: true}) extraButtons: ElementRef;
  active: string;
  private end = new Subject<void>();

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

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit() {
    if (!this.selectedTab$) {
      this.selectedTab$ = new BehaviorSubject(this.panelTabs[0]);
    }
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
   * Next value of activated tab to the BehaviorSubject
   */
  tabClicked(tab: string): void {
    this.selectedTab$.next(tab);
  }

  closePanel(): void {
    this.HsLayoutService.closePanel(this.name);
  }
}
