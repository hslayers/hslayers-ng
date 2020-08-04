export interface HsButton {
  panel?;
  module?: string;
  order?: number;
  title?: string;
  description?: string;
  icon?: string;
  condition?: boolean;
  content?;
  important?: boolean;
  click?;
  visible?: boolean;
}
