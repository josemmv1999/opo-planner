export interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/home', icon: 'home', labelKey: 'nav.home' },
  { path: '/syllabus', icon: 'syllabus', labelKey: 'nav.syllabus' },
  { path: '/notes', icon: 'notes', labelKey: 'nav.notes' },
  { path: '/exams', icon: 'timer', labelKey: 'nav.exams' },
  { path: '/mock-exams', icon: 'tests', labelKey: 'nav.mockExams' },
  { path: '/planner', icon: 'planner', labelKey: 'nav.planner' },
];
