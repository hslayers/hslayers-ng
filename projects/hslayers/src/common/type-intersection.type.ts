/**
 * Creates interesection of two types with working unwrapped tooltip
 */
export type IntersectWithTooltip<T> = {[P in keyof T]: T[P]};
