export type UserRole = 'viewer' | 'host' | 'admin';
export interface User { role: UserRole; }
export interface RolePermissions { canViewQuizzes: boolean; canJoinQuizzes: boolean; canCreateQuizzes: boolean; canManageQuizzes: boolean; canViewResults: boolean; canAccessAdmin: boolean; }
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  viewer: { canViewQuizzes: true, canJoinQuizzes: true, canCreateQuizzes: false, canManageQuizzes: false, canViewResults: false, canAccessAdmin: false },
  host: { canViewQuizzes: true, canJoinQuizzes: true, canCreateQuizzes: true, canManageQuizzes: true, canViewResults: true, canAccessAdmin: false },
  admin: { canViewQuizzes: true, canJoinQuizzes: true, canCreateQuizzes: true, canManageQuizzes: true, canViewResults: true, canAccessAdmin: true },
};
