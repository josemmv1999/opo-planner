import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { StudiedBlock, WeakBlock } from '../../../common/models/home.model';

const barColor = (percentage: number): string => {
  if (percentage < 50) return 'bg-danger';
  if (percentage < 60) return 'bg-secondary';
  return 'bg-warning';
};

@Component({
  selector: 'app-blocks-card',
  imports: [RouterLink, TranslatePipe, Icon],
  template: `
    <section class="card card--teal h-100">
      <div class="card-body">
        <h2 class="card-title fs-5">{{ 'home.blocks.title' | translate }}</h2>
        <div class="row g-4">
          <div class="col-12 col-md-8">
            <h3 class="fs-6">{{ 'home.blocks.weak' | translate }}</h3>
            <ul class="list-unstyled d-flex flex-column gap-3 mb-0">
              @for (block of weakBlocksWithColor(); track block.id) {
                <li class="d-flex align-items-center gap-3">
                  <div class="flex-grow-1">
                    <div class="d-flex justify-content-between gap-2 mb-1">
                      <span>{{ block.name }}</span>
                      <span class="fw-bold text-nowrap">
                        {{ 'home.blocks.percentage' | translate: { percentage: block.correctPercentage } }}
                      </span>
                    </div>
                    <div
                      class="progress"
                      role="progressbar"
                      [attr.aria-label]="block.name"
                      [attr.aria-valuenow]="block.correctPercentage"
                      aria-valuemin="0"
                      aria-valuemax="100">
                      <div [class]="'progress-bar ' + block.barColor" [style.width.%]="block.correctPercentage"></div>
                    </div>
                  </div>
                  <a
                    class="btn btn-outline-primary btn-sm"
                    routerLink="/mock-exams"
                    [queryParams]="{ block: block.id }">
                    {{ 'home.blocks.practice' | translate }}
                  </a>
                </li>
              } @empty {
                <li class="text-body-secondary">{{ 'home.blocks.noWeak' | translate }}</li>
              }
            </ul>
          </div>
          <div class="col-12 col-md-4">
            <h3 class="fs-6">{{ 'home.blocks.studied' | translate }}</h3>
            <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
              @for (block of studiedBlocks(); track block.id) {
                <li class="d-flex align-items-center">
                  <app-icon class="text-success me-2" name="check" />
                  {{ block.name }}
                </li>
              } @empty {
                <li class="text-body-secondary">{{ 'home.blocks.noStudied' | translate }}</li>
              }
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocksCard {
  readonly studiedBlocks = input.required<StudiedBlock[]>();
  readonly weakBlocks = input.required<WeakBlock[]>();

  protected readonly weakBlocksWithColor = computed(() =>
    this.weakBlocks().map((block) => ({ ...block, barColor: barColor(block.correctPercentage) })),
  );
}
