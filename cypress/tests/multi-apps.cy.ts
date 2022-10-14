describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/multi-apps');
  });

  it('should display multiple hslayers elements', () => {
    cy.get('hslayers').should('have.length', 2);
  });
});
