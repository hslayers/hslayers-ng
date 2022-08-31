describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display Hslayers map and sidebar elements', () => {
    cy.get('hs-map');
    cy.get('hs-sidebar');
  });
});
