export const xpos = ['left', 'right', 'center'] as const;
export type xPos = (typeof xpos)[number];

export const ypos = ['top', 'middle', 'bottom'] as const;
export type yPos = (typeof ypos)[number];
