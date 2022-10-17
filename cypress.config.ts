/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/no-var-requires */
import {defineConfig} from 'cypress';

export default defineConfig({
  projectId: '69m3n7',
  fixturesFolder: 'cypress/fixtures',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config);
    },
    specPattern: 'cypress/tests/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:4200',
  },
});
