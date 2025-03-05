export interface AuthState {
  user?: string;
  authenticated?: boolean;
}

export interface AuthAction {
  type: 'login' | 'logout';
}
