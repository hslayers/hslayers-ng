export type StatusData = {
  success?: boolean;
  overWriteNeeded?: boolean;
  resultCode?: string;
  error?: any;
  status?: boolean;
  /**
   * Whether it is possible for current user to edit composition with
   * existing name
   */
  canEditExistingComposition?: boolean;
};
