describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
    //Open layer manager
    cy.get('.hs-sidebar-item[data-cy="layermanager"]').click();
  });

  it('Should zoom to feature', () => {
    cy.get('#poly1').click();
    //TODO: Do it without `if` when PR for snapshot based testing is merged
    if (cy.get('.hs-ol-map').matchImage) {
      cy.get('.hs-ol-map').matchImage();
    }
  });

  it('Should open info panel', () => {
    cy.get('#poly1').click();
    cy.get(`hs-panel-header[name="info"]`).should('be.visible');
  });

  it('Should open popup', () => {
    cy.get('#poly2').click();
    cy.get(`.hs-hover-popup`).should('be.visible');
  });
});
