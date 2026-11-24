import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, forkJoin, map, pipe, switchMap, tap } from 'rxjs';
import { InterfaceMode, OppositionOption } from '../../common/models/onboarding.model';
import { PasswordChange } from '../../common/models/user.model';
import { InterfaceModeService } from '../../common/services/interface-mode.service';
import { NotificationService } from '../../common/services/notification.service';
import { AccountService } from '../services/account.service';
import { OnboardingService } from '../services/onboarding.service';
import { OppositionService } from '../services/opposition.service';

interface ProfileState {
  catalog: OppositionOption[];
  oppositionIds: string[];
  selectedIds: string[];
  isAddModalOpen: boolean;
  isLoadingOppositions: boolean;
  isAddingOppositions: boolean;
  oppositionToRemoveId: string | null;
  isRemovingOpposition: boolean;
  isChangingPassword: boolean;
  passwordFormKey: number;
  error: 'loading' | 'adding' | 'removing' | 'password' | null;
}

export const ProfileStore = signalStore(
  withState<ProfileState>({
    catalog: [],
    oppositionIds: [],
    selectedIds: [],
    isAddModalOpen: false,
    isLoadingOppositions: false,
    isAddingOppositions: false,
    oppositionToRemoveId: null,
    isRemovingOpposition: false,
    isChangingPassword: false,
    passwordFormKey: 0,
    error: null,
  }),
  withComputed(
    ({ catalog, oppositionIds }, interfaceModeService = inject(InterfaceModeService)) => ({
      oppositions: computed(() => catalog().filter(({ id }) => oppositionIds().includes(id))),
      canRemoveOppositions: computed(() => oppositionIds().length > 1),
      availableOppositions: computed(() =>
        catalog().filter(({ id }) => !oppositionIds().includes(id)),
      ),
      interfaceMode: interfaceModeService.mode,
      detectedInterfaceMode: interfaceModeService.detectedMode,
    }),
  ),
  withMethods(
    (
      store,
      onboardingService = inject(OnboardingService),
      accountService = inject(AccountService),
      oppositionService = inject(OppositionService),
      interfaceModeService = inject(InterfaceModeService),
      notificationService = inject(NotificationService),
    ) => ({
      loadOppositions: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoadingOppositions: true, error: null })),
          switchMap(() =>
            forkJoin({
              catalog: onboardingService.getOppositions(),
              oppositionIds: oppositionService.getUserOppositionIds(),
            }).pipe(
              tapResponse({
                next: ({ catalog, oppositionIds }) =>
                  patchState(store, { catalog, oppositionIds, isLoadingOppositions: false }),
                error: () => patchState(store, { isLoadingOppositions: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      openAddModal(): void {
        patchState(store, { isAddModalOpen: true, selectedIds: [], error: null });
      },
      closeAddModal(): void {
        patchState(store, { isAddModalOpen: false, selectedIds: [] });
      },
      toggleSelection(oppositionId: string): void {
        patchState(store, ({ selectedIds }) => ({
          selectedIds: selectedIds.includes(oppositionId)
            ? selectedIds.filter((id) => id !== oppositionId)
            : [...selectedIds, oppositionId],
        }));
      },
      addSelected: rxMethod<void>(
        pipe(
          map(() => store.selectedIds()),
          filter((selectedIds) => selectedIds.length > 0),
          tap(() => patchState(store, { isAddingOppositions: true, error: null })),
          switchMap((selectedIds) =>
            oppositionService.addOppositions(selectedIds).pipe(
              tapResponse({
                next: (oppositionIds) => {
                  patchState(store, {
                    oppositionIds,
                    selectedIds: [],
                    isAddModalOpen: false,
                    isAddingOppositions: false,
                  });
                  notificationService.success('profile.oppositionsAdded');
                },
                error: () => patchState(store, { isAddingOppositions: false, error: 'adding' }),
              }),
            ),
          ),
        ),
      ),
      openRemoveModal(oppositionToRemoveId: string): void {
        patchState(store, { oppositionToRemoveId, error: null });
      },
      closeRemoveModal(): void {
        patchState(store, { oppositionToRemoveId: null });
      },
      removeOpposition: rxMethod<void>(
        pipe(
          map(() => store.oppositionToRemoveId()),
          filter((oppositionId): oppositionId is string => oppositionId !== null),
          tap(() => patchState(store, { isRemovingOpposition: true, error: null })),
          switchMap((oppositionId) =>
            oppositionService.removeOpposition(oppositionId).pipe(
              tapResponse({
                next: (oppositionIds) => {
                  patchState(store, {
                    oppositionIds,
                    oppositionToRemoveId: null,
                    isRemovingOpposition: false,
                  });
                  notificationService.success('profile.oppositionRemoved');
                },
                error: () => patchState(store, { isRemovingOpposition: false, error: 'removing' }),
              }),
            ),
          ),
        ),
      ),
      changePassword: rxMethod<PasswordChange>(
        pipe(
          tap(() => patchState(store, { isChangingPassword: true, error: null })),
          switchMap((change) =>
            accountService.changePassword(change).pipe(
              tapResponse({
                next: () => {
                  patchState(store, ({ passwordFormKey }) => ({
                    isChangingPassword: false,
                    passwordFormKey: passwordFormKey + 1,
                  }));
                  notificationService.success('profile.passwordChanged');
                },
                error: () =>
                  patchState(store, { isChangingPassword: false, error: 'password' as const }),
              }),
            ),
          ),
        ),
      ),
      setInterfaceMode(mode: InterfaceMode | null): void {
        interfaceModeService.setMode(mode);
      },
    }),
  ),
);
