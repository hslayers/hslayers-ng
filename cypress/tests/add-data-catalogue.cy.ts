function openAddDataPanel() {
  //Open add-data panel
  cy.get(
    'hs-sidebar .hs-sidebar-item:not(.hs-panel-hidden)[data-cy="addData"]'
  ).click();
  cy.get(`hs-panel-header[name="addData"]`).should('be.visible');
}

describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
    //Open layer manager
    cy.get('.hs-sidebar-item[data-cy="layermanager"]').click();
    //Turn off all layers
    cy.get('hs-layermanager-layer-list li .d-flex button.hs-checkmark').each(
      (button) => {
        cy.wrap(button).click();
      }
    );
  });

  it('WMS layer should be visible on map', () => {
    openAddDataPanel();
  });
});
