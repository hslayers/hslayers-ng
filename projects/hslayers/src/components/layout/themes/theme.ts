export interface Theme {
  name?: string;
  properties?;
}

export enum Themes {
  dark = 'dark',
  light = 'light',
}

export const light: Theme = {
  name: Themes.light,
  properties: {
    '--text-color': 'hsl(0, 0%, 0%)',
    '--panel-wrapper-bg-color': 'hsl(0, 0%, 100%)',

    //*****Sidebar*****//
    //Background color of sidebar
    '--sidebar-bg-color': 'hsl(0, 0%, 100%)',
    //Color of sidebar icon
    '--sidebar-item-color': 'hsl(211, 100%, 50%)',
    '--sidebar-item-color-active': 'hsl(0, 0%, 100%)',
    //Background color of active sidebar item
    '--sidebar-bg-color-active': 'hsl(211, 100%, 50%)',
    //*PRIMARY */
    '--primary': 'hsl(211deg, 100%, 50%)',
    '--primary-h': '211',
    '--primary-s': '100%',
    '--primary-l': '50%',
    // '--primary-a': 1,
    //*SECONDARY */
    '--secondary': 'hsl(208, 7%, 46%)',
    '--secondary-h': 208,
    '--secondary-s': '7%',
    '--secondary-l': '46%',
    '--secondary-a': 1,
    //*LIGHT */
    '--light': 'hsl(210, 17%, 94%)',
    '--light-h': 210,
    '--light-s': '17%',
    '--light-l': '98%',
    '--light-a': 1,
    //*GREY-200 */
    '--gray-200': 'hsl(210, 16%, 93%)',
    '--gray-200-h': 210,
    '--gray-200-s': '16%',
    '--gray-200-l': '93%',
    '--gray-200-a': 1,
    //*GREY-800 */
    '--gray-800': 'hsl(210, 10%, 23%)',
    //*GREY-900 */
    '--gray-900': 'hsl(210, 11%, 15%)', 
    /* WHITE */
    '--white': 'hsl(0, 0%, 100%)',
    '--white-h': '0',
    '--white-s': '0%',
    '--white-l': '100%',
    '--white-a': 1,

    '--map-controls-bg': 'hsla(214, 100%, 27%, 0.5)',
  },
};

export const dark: Theme = {
  name: Themes.dark,
  properties: {
    '--text-color': 'hsla(0, 0%, 100%, 87%)',
    '--panel-wrapper-bg-color': 'hsl(220, 29%, 12%)',

    //*****Sidebar*****//
    //Background color of sidebar
    '--sidebar-bg-color': 'hsl(218, 27%, 18%)',
    //Background color of active sidebar item
    '--sidebar-bg-color-active': 'hsl(45, 95%, 43%)',
    //Color of sidebar icon
    '--sidebar-item-color': 'hsl(0, 0%, 100%)',
    '--sidebar-item-color-active': 'hsl(0, 0%, 100%)',
    //*PRIMARY */
    '--primary': 'hsl(199deg 76% 40%)',
    '--primary-h': 199,
    '--primary-s': '76%',
    '--primary-l': '40%',
    // '--primary-a': 1,
    //*SECONDARY */
    '--secondary': 'hsl(45, 95%, 43%)',
    '--secondary-h': 45,
    '--secondary-s': '95%',
    '--secondary-l': '45%',
    '--secondary-a': 1,
    //*LIGHT */
    '--light': 'hsl(220, 29%, 22%)',
    '--light-h': 220,
    '--light-s': '29%',
    '--light-l': '22%',
    '--light-a': 1,
    //*GREY-200 */
    '--gray-200': 'hsl(220, 31%, 15%)',
    '--gray-200-h': 220,
    '--gray-200-s': '29%',
    '--gray-200-l': '22%',
    '--gray-200-a': 1,
    //*GREY-800 */
    '--gray-800': 'hsla(0, 0%, 100%, 60%)',
    //*GREY-900 */
    '--gray-900': 'hsla(0, 0%, 100%, 69%)',
    /* WHITE */
    '--white': 'hsl(217deg 16% 21%)',
    '--white-h': '217',
    '--white-s': '16%',
    '--white-l': '21%',
    // '--white-a': 1,

    '--font-weight-bold': 600,
    '--font-weight-normal': 350,
    '--map-controls-bg': 'hsl(218, 27%, 18%)',
  },
};
