import { makeAutoObservable } from 'mobx';
import { User, UserRole, ROLE_PERMISSIONS, RolePermissions } from '@/types';
import { BUILTIN_HOST, ADMIN_PASSWORD } from '@/constants/auth';
import { dataStore } from './DataStore';

const AUTH_STORAGE_KEY = 'quiz_platform_auth';
const SESSION_EXPIRY_KEY = 'quiz_platform_session_expiry';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

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
  get displayName(): string {
    if (this._user.name) return this._user.name;
    if (this._user.role === 'admin') return 'Администратор';
    if (this._user.role === 'host') return BUILTIN_HOST.name;
    return 'Гость';
  }

  get ownerId(): string | undefined {
    if (this._user.hostId) return this._user.hostId;
    if (this._user.role === 'host') return BUILTIN_HOST.id;
    return undefined;
  }

  ownsQuiz = (quiz: { hostId?: string }): boolean => {
    if (this.isAdmin) return true;
    if (!this.isHost) return false;
    return quiz.hostId === this.ownerId;
  };

  canCreateQuizzes = (): boolean => this.permissions.canCreateQuizzes;
  canManageQuizzes = (): boolean => this.permissions.canManageQuizzes;
  canViewResults = (): boolean => this.permissions.canViewResults;
  canAccessAdmin = (): boolean => this.permissions.canAccessAdmin;

  hasRole = (r: UserRole): boolean => ({ viewer: 0, host: 1, admin: 2 }[this._user.role] >= { viewer: 0, host: 1, admin: 2 }[r]);

  private loadAuthState = (): void => {
    try {
      const s = localStorage.getItem(AUTH_STORAGE_KEY);
      const e = localStorage.getItem(SESSION_EXPIRY_KEY);
      if (s && e) {
        const a = JSON.parse(s) as User;
        if (Date.now() < parseInt(e, 10) && a.role !== 'viewer') {
          this._user = { role: a.role, name: a.name, email: a.email, hostId: a.hostId };
        } else {
          this.clearAuthStorage();
        }
      }
    } catch {
      this.clearAuthStorage();
    }
  };

  private saveAuthState = (): void => {
    try {
      if (this._user.role !== 'viewer') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          role: this._user.role,
          name: this._user.name,
          email: this._user.email,
          hostId: this._user.hostId,
        }));
        localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
      } else {
        this.clearAuthStorage();
      }
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  private clearAuthStorage = (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  };

  openLoginModal = (): void => { this.loginModalOpen = true; this.loginError = null; };
  closeLoginModal = (): void => { this.loginModalOpen = false; this.loginError = null; this.isLoading = false; };

  login = async (role: Exclude<UserRole, 'viewer'>, password: string, email?: string): Promise<boolean> => {
    this.isLoading = true;
    this.loginError = null;
    try {
      await new Promise(r => setTimeout(r, 500));

      if (role === 'admin') {
        if (ADMIN_PASSWORD === password) {
          this._user = { role: 'admin', name: 'Администратор' };
          this.saveAuthState();
          this.closeLoginModal();
          return true;
        }
        this.loginError = 'Неверный пароль';
        return false;
      }

      const trimmedEmail = email?.trim().toLowerCase() ?? '';
      if (!trimmedEmail) {
        this.loginError = 'Введите email';
        return false;
      }

      if (trimmedEmail === BUILTIN_HOST.email && password === BUILTIN_HOST.password) {
        this._user = { role: 'host', name: BUILTIN_HOST.name, email: BUILTIN_HOST.email, hostId: BUILTIN_HOST.id };
        this.saveAuthState();
        this.closeLoginModal();
        return true;
      }

      if (!dataStore.hosts.length && !dataStore.hostsLoading) {
        await dataStore.loadHosts();
      }

      const host = dataStore.findHostByEmail(trimmedEmail);
      if (host && host.password === password) {
        this._user = { role: 'host', name: host.name, email: host.email, hostId: host.id };
        this.saveAuthState();
        this.closeLoginModal();
        return true;
      }

      this.loginError = 'Неверный email или пароль';
      return false;
    } catch (error) {
      this.loginError = 'Ошибка авторизации';
      console.error('Login error:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  };

  logout = (): void => { this._user = { role: 'viewer' }; this.clearAuthStorage(); this.loginError = null; };
  clearError = (): void => { this.loginError = null; };
}

export const authStore = new AuthStore();
