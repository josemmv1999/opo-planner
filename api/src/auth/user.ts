export interface UserRow {
  id: number;
  name: string;
  surname: string;
  email: string;
  password_hash: string;
  is_admin: number;
  has_completed_onboarding: number;
}

export interface User {
  name: string;
  surname: string;
  email: string;
  hasCompletedOnboarding: boolean;
  isAdmin: boolean;
}

export const toUser = ({
  name,
  surname,
  email,
  is_admin,
  has_completed_onboarding,
}: UserRow): User => ({
  name,
  surname,
  email,
  hasCompletedOnboarding: !!has_completed_onboarding,
  isAdmin: !!is_admin,
});
