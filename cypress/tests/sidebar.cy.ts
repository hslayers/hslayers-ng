describe('Hslayers application', () => {
  before(() => {
    cy.visit('/');
    //Open layer manager
    cy.get('.hs-sidebar-item[data-cy="layermanager"]').click();
    //Turn off all layers
    cy.get('hs-layermanager-layer-list li .d-flex button.hs-checkmark').each(
      (button) => {
        cy.wrap(button).click();
      }
    );
    //Close layer manager
    cy.get('.hs-sidebar-item[data-cy="layermanager"]:first').click();
  });

  it('All panels should open', () => {
    cy.wait(200);
    cy.get('hs-sidebar .hs-sidebar-item:not(.hs-panel-hidden)').each(
      (sidebarButton) => {
        const panelName = sidebarButton.attr('data-cy');
        if (panelName) {
          cy.wrap(sidebarButton).click();
          //Check if panel header visible
          cy.get(`hs-panel-header[name="${panelName}"]`).should('be.visible');
          cy.wrap(sidebarButton).click();
        }
      }
    );
    cy.get('.hs-sidebar-additional-items:first').click();
    cy.get('hs-mini-sidebar .hs-sidebar-item.hs-panel-hidden').each(
      (sidebarButton) => {
        const panelName = sidebarButton.attr('data-cy');
        if (panelName) {
          cy.wrap(sidebarButton).click();
          cy.get(`hs-panel-header[name="${panelName}"]`).should('be.visible');
          cy.get('.hs-sidebar-additional-items:first').click();
        }
      }
    );
  });
});
