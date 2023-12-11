describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
    //Open layer manager
    cy.get('.hs-sidebar-item[data-cy="layermanager"]').click();
    //Turn off all layers
    cy.get('hs-layer-manager-layer-list li .d-flex button.hs-checkmark').each(
      (button) => {
        cy.wrap(button).click();
      },
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
      },
    );
    cy.get('.hs-sidebar-additional-items:first').click();
    cy.get('hs-mini-sidebar .hs-sidebar-item.hs-panel-hidden').each(
      (sidebarButton, i) => {
        const panelName = sidebarButton.attr('data-cy');
        if (panelName) {
          //Click kept failing even tho wrap yielded element
          //cy.wrap(sidebarButton).click();
          cy.get('hs-mini-sidebar .hs-sidebar-item.hs-panel-hidden')
            .eq(i)
            .click();
          cy.get(`hs-panel-header[name="${panelName}"]`).should('be.visible');
          cy.get('.hs-sidebar-additional-items:first').click();
        }
      },
    );
  });

  it('Only 8 sidebar panels should be visible', () => {
    cy.viewport(600, 1000);
    // Wait for the layout to update
    cy.wait(500);
    cy.get('hs-sidebar  span.hs-sidebar-item:not(.hs-panel-hidden)')
      .its('length')
      .should('equal', 8);
  });
});
