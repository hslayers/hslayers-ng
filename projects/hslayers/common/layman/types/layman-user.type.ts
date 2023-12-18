/**
 * Change access rights for everyone
 * @param username - Username of the user.
 * @param screenName - Screen name of the user.
 * @param givenName - Given name of the user.
 * @param familyName - Family name of the user
 * @param middleName - Middle name of the user
 * @param name - Whole name of the user (given_name + middle_name + family_name).
 * @param hslDisplayName - (Optional) Carefully selected word from other user properties, that is used in Hslayers templates
 * @param read - (Optional) Layman read rights status
 * @param write - (Optional) Layman write rights status
 */
export type LaymanUser = {
  username: string;
  screenName: string;
  givenName: string;
  familyName: string;
  middleName: string;
  name: string;
  hslDisplayName?: string;
  read?: boolean;
  write?: boolean;
};
