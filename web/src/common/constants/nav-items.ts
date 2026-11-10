export interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/home', icon: 'home', labelKey: 'nav.home' },
  { path: '/syllabus', icon: 'syllabus', labelKey: 'nav.syllabus' },
  { path: '/exams', icon: 'timer', labelKey: 'nav.exams' },
  { path: '/planner', icon: 'planner', labelKey: 'nav.planner' },
];
