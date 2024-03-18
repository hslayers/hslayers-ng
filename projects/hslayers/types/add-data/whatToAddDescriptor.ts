export type WhatToAddDescriptorBase = {
  dsType?: string;
  layer?;
  link?;
  name?;
  title?: string;
  abstract?: string;
  projection?;
  extractStyles?;
  editable?: boolean;
  workspace?: string;
  style?: string;
  recordType?: string;
};

/**
 * Generic type that extends the base type with a type property, where the type of type can be specified as needed
 * eg. WhatToAddDescriptor<string> or WhatToAddDescriptor<string[]>. Using just WhatToAddDescriptor both are valid
 */
export type WhatToAddDescriptor<TypeType = string | string[]> =
  WhatToAddDescriptorBase & {
    type: TypeType;
  };
