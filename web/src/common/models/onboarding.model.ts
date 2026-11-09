export interface OppositionOption {
  id: string;
  level: 'C1' | 'C2';
  name: string;
  body: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface StudySchedule {
  days: number[];
  slots: TimeSlot[];
}

export type InterfaceMode = 'desktop' | 'touch';

export interface OnboardingData {
  oppositionIds: string[];
  schedules: Record<string, StudySchedule>;
  interfaceMode: InterfaceMode | null;
}
