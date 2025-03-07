export interface HsAuthState {
  user?: string;
  authenticated?: boolean;
}

export interface HsAuthAction {
  type: 'login' | 'logout';
}
