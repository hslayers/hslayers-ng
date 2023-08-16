describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
    //Open layer manager
    cy.get('.hs-sidebar-item[data-cy="layermanager"]').click();
    //Open remove layer dialog
  });

  it('Should remove layers from map', () => {
    cy.get('.card-header > .d-flex > .btn-group > .dropdown-toggle').click();
    cy.get('extra-buttons .dropdown-menu.show a').first().click();

    cy.get('hs-rm-layer-dialog').should('exist');
    const removeButton = cy
      .get('hs-rm-layer-dialog .modal-footer button')
      .first();
    removeButton.should('be.disabled');

    cy.get('hs-rm-layer-dialog .modal-body button').first().click();
    cy.get('hs-rm-layer-dialog .modal-footer button')
      .first()
      .should('not.be.disabled');

    cy.get('hs-rm-layer-dialog .modal-body button.hs-uncheckmark')
      .its('length')
      .then((len) => {
        cy.get('hs-rm-layer-dialog .modal-body button')
          .contains('Toggle all')
          .should('exist')
          .click();
        //All layers checkboxes should be checked
        cy.get('hs-rm-layer-dialog .modal-body button.hs-checkmark').should(
          'have.length',
          len,
        );
        cy.get('hs-rm-layer-dialog .modal-footer button').first().click();
        //Layers should be removed
        cy.get('hs-layermanager-layer-list').should('not.exist');
      });
  });
});
