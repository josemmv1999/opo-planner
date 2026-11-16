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

export const ADMIN_NAV_ITEM: NavItem = { path: '/admin', icon: 'settings', labelKey: 'nav.admin' };

export const navItemsFor = (isAdmin = false): readonly NavItem[] =>
  isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
