describe('Hslayers layout', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should close toolbar, be able to click on basemap gallery icon button and click on OpenStreetMap layer', () => {
    cy.get('hs-search-input button')
      .first()
      .click()
      .then(($input) => {
        cy.get('hs-search-input input').first().should('not.be.visible');
      });
    cy.getBySel('basemap-gallery').eq(0).click();
    cy.getBySelLike('OpenStreet').eq(0).click();
  });

  it("'Custom' panel should have correct width and should be possible to close it", () => {
    cy.get('hs-some-panel').first().invoke('outerWidth').should('to.be', 550);
    cy.getBySel('custom')
      .first()
      .click()
      .then(($btn) => {
        cy.get('hs-sidebar').first().invoke('outerWidth').should('to.be', 400);
      });
  });

  it('should close sidebar', () => {
    cy.get('.hs-sidebar-item')
      .first()
      .click()
      .then((a) => {
        cy.get('hs-sidebar').first().invoke('outerWidth').should('be.lt', 49);
      });
  });

  it('hs-defaultView should be visible', () => {
    cy.get('.hs-defaultView').first().should('be.visible');
  });

  it('should start in mobile view and be switched to normal later', () => {
    cy.viewport(766, 1000);
    cy.get('.hs-content-wrapper')
      .first()
      .invoke('css', 'flex-direction', 'none')
      .should('have.css', 'flex-direction', 'column')
      .then(() => {
        cy.viewport(1200, 1000);
        cy.wait(250);
        cy.get('.hs-page-wrapper').should('not.have.class', 'hs-mobile-view');
      });
  });

  it('should toggle mobile sidebar', () => {
    cy.viewport(766, 1000);
    cy.get('.hs-panelspace-expander')
      .click()
      .then((a) => {
        cy.get('.hs-panelspace-wrapper')
          .should('have.class', 'expanded')
          .should('have.css', 'height', `700px`);
        cy.get('.hs-panelspace-expander')
          .click()
          .then((a) => {
            cy.get('.hs-panelspace-wrapper')
              .should('not.have.class', 'expanded')
              .should('have.css', 'height', `400px`);
          });
      });
  });
});
