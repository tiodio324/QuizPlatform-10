import { makeAutoObservable } from 'mobx';
import { User, UserRole, ROLE_PERMISSIONS, RolePermissions } from '@/types';

const AUTH_STORAGE_KEY = 'quiz_platform_auth';
const SESSION_EXPIRY_KEY = 'quiz_platform_session_expiry';
const SESSION_DURATION = 24 * 60 * 60 * 1000;
const AUTH_CREDENTIALS: Record<Exclude<UserRole, 'viewer'>, string> = { host: 'host2026-quiz', admin: 'admin2026-quiz' };

export class AuthStore {
  private _user: User = { role: 'viewer' };
  loginModalOpen = false; loginError: string | null = null; isLoading = false;

  constructor() { makeAutoObservable(this, {}, { autoBind: true }); this.loadAuthState(); }

  get user(): User { return this._user; }
  get isAuthenticated(): boolean { return this._user.role !== 'viewer'; }
  get isHost(): boolean { return this._user.role === 'host' || this._user.role === 'admin'; }
  get isAdmin(): boolean { return this._user.role === 'admin'; }
  get permissions(): RolePermissions { return ROLE_PERMISSIONS[this._user.role]; }
  get currentRole(): UserRole { return this._user.role; }

  canCreateQuizzes = (): boolean => this.permissions.canCreateQuizzes;
  canManageQuizzes = (): boolean => this.permissions.canManageQuizzes;
  canViewResults = (): boolean => this.permissions.canViewResults;
  canAccessAdmin = (): boolean => this.permissions.canAccessAdmin;

  hasRole = (r: UserRole): boolean => ({ viewer: 0, host: 1, admin: 2 }[this._user.role] >= { viewer: 0, host: 1, admin: 2 }[r]);

  private loadAuthState = (): void => { try { const s = localStorage.getItem(AUTH_STORAGE_KEY), e = localStorage.getItem(SESSION_EXPIRY_KEY); if (s && e) { const a = JSON.parse(s); if (Date.now() < parseInt(e, 10) && a.role !== 'viewer') this._user = { role: a.role }; else this.clearAuthStorage(); } } catch { this.clearAuthStorage(); } };
  private saveAuthState = (): void => { try { if (this._user.role !== 'viewer') { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role: this._user.role })); localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION)); } else this.clearAuthStorage(); } catch (error) { console.error('Failed to save auth state:', error); } };
  private clearAuthStorage = (): void => { localStorage.removeItem(AUTH_STORAGE_KEY); localStorage.removeItem(SESSION_EXPIRY_KEY); };

  openLoginModal = (): void => { this.loginModalOpen = true; this.loginError = null; };
  closeLoginModal = (): void => { this.loginModalOpen = false; this.loginError = null; this.isLoading = false; };

  login = async (role: Exclude<UserRole, 'viewer'>, password: string): Promise<boolean> => {
    this.isLoading = true; this.loginError = null;
    try { await new Promise(r => setTimeout(r, 500)); if (AUTH_CREDENTIALS[role] === password) { this._user = { role }; this.saveAuthState(); this.closeLoginModal(); return true; } this.loginError = 'Неверный пароль'; return false; }
    catch (error) { this.loginError = 'Ошибка авторизации'; console.error('Login error:', error); return false; }
    finally { this.isLoading = false; }
  };

  logout = (): void => { this._user = { role: 'viewer' }; this.clearAuthStorage(); this.loginError = null; };
  clearError = (): void => { this.loginError = null; };
}

export const authStore = new AuthStore();
