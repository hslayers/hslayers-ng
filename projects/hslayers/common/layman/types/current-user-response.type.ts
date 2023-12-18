export type CurrentUserResponse = {
  authenticated?: boolean;
  claims?: {
    email?: string;
    email_verified?: boolean;
    family_name?: string;
    given_name?: string;
    iss?: string;
    middle_name?: string;
    name?: string;
    preferred_username?: string;
    screen_name?: string;
  };
  username?: string;
  code?: number;
};
