/**
 * Change access rights for everyone
 * @param username - Username of the user.
 * @param screen_name - Screen name of the user.
 * @param given_name - Given name of the user.
 * @param family_name - Family name of the user
 * @param middle_name - Middle name of the user
 * @param name - Whole name of the user (given_name + middle_name + family_name).
 * @param hslDisplayName - (Optional) Carefully selected word from other user properties, that is used in Hslayers templates
 * @param read - (Optional) Layman read rights status
 * @param write - (Optional) Layman write rights status
 */
export type LaymanUser = {
  username: string;
  screen_name: string;
  given_name: string;
  family_name: string;
  middle_name: string;
  name: string;
  hslDisplayName?: string;
  read?: boolean;
  write?: boolean;
};
