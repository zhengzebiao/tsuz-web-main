import type { ApiClient } from "@tsuz/api";
import { createMainApiClient } from "./api-client";

export interface EmailRegistrationCodeRequest {
  email: string;
}

export interface EmailChallengeResponse {
  challenge_id: string;
  expires_in: number;
  resend_after: number;
}

export interface EmailRegistrationRequest {
  email: string;
  challenge_id: string;
  code: string;
  password: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface PasswordForgotCodeRequest {
  email: string;
}

export interface PasswordForgotCodeResponse extends EmailChallengeResponse {
  message: string;
}

export interface PasswordResetRequest {
  email: string;
  challenge_id: string;
  code: string;
  new_password: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number;
}

export interface LogoutResponse {
  message: string;
}

export interface UserResponse {
  id: string;
  username: string;
  roles?: string[];
}

export interface AuthApi {
  sendEmailRegistrationCode: (
    body: EmailRegistrationCodeRequest
  ) => Promise<EmailChallengeResponse>;
  registerWithEmail: (body: EmailRegistrationRequest) => Promise<TokenResponse>;
  loginWithEmail: (body: EmailLoginRequest) => Promise<TokenResponse>;
  sendPasswordResetCode: (body: PasswordForgotCodeRequest) => Promise<PasswordForgotCodeResponse>;
  resetPassword: (body: PasswordResetRequest) => Promise<PasswordResetResponse>;
  refresh: (body: RefreshTokenRequest) => Promise<TokenResponse>;
  logout: () => Promise<LogoutResponse>;
  getCurrentUser: () => Promise<UserResponse>;
}

export function createAuthApi(client: ApiClient = createMainApiClient()): AuthApi {
  return {
    sendEmailRegistrationCode: (body) =>
      client.post<EmailChallengeResponse>("/auth/email/register/code", body, { skipAuthRefresh: true }),
    registerWithEmail: (body) =>
      client.post<TokenResponse>("/auth/email/register", body, { skipAuthRefresh: true }),
    loginWithEmail: (body) => client.post<TokenResponse>("/auth/email/login", body, { skipAuthRefresh: true }),
    sendPasswordResetCode: (body) =>
      client.post<PasswordForgotCodeResponse>("/auth/password/forgot/code", body, { skipAuthRefresh: true }),
    resetPassword: (body) =>
      client.post<PasswordResetResponse>("/auth/password/reset", body, { skipAuthRefresh: true }),
    refresh: (body) => client.post<TokenResponse>("/auth/refresh", body, { skipAuthRefresh: true }),
    logout: () => client.post<LogoutResponse>("/auth/logout"),
    getCurrentUser: () => client.get<UserResponse>("/auth/me")
  };
}
