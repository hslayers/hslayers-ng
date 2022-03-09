describe('Hslayers workshop test', () => {
  it('Visit Hslayers application', () => {
    cy.visit('/');
  });
});

describe('Hslayers layout', () => {
  describe('Hslayers page', () => {
    it('should display Hslayers map and sidebar elements', () => {
      cy.get('hs-map');
      cy.get('hs-sidebar');
    });
  });
});
