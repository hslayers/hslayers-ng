describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
    //Open layer manager
    cy.get('.hs-sidebar-item[data-cy="layermanager"]').click();
    //Turn off all layers
    cy.get('hs-layermanager-layer-list li .d-flex button.hs-checkmark').each(
      (button) => {
        cy.wrap(button).click();
      },
    );
  });

  function openStyler() {
    cy.get('.hs-lm-layerlist:not([hidden]):last .hs-lm-item:first')
      .find('.d-flex .info_btn')
      .click();
    cy.get('hs-layer-editor button[title="Style layer"]').click();
    cy.get('hs-rule-list-item').click();
    cy.get('hs-symbolizer-list-item').click();
  }

  it('Styler should open', () => {
    openStyler();
    cy.get('hs-symbolizer').should('exist');
    cy.get('hs-symbolizer').should('have.length', 1);
    cy.get('hs-symbolizer hs-mark-symbolizer').should('exist');
    cy.get('hs-symbolizer hs-mark-symbolizer select:first').should(
      'have.attr',
      'ng-reflect-model',
      'circle',
    );
  });

  it('Style can be reset to default', () => {
    openStyler();
    cy.get('hs-styles button[title="Reset to default style"]').click();
    cy.wait(500);
    cy.get('hs-symbolizer').should('not.exist');
    cy.get('hs-rule-list-item').click();
    cy.get('hs-symbolizer-list-item:first').click();
    cy.get(
      'hs-symbolizer hs-symbolizer-color-picker[data-cy="mark-symbolizer-color"] input',
    ).should(
      'have.attr',
      'style',
      'background-color: rgb(255, 255, 255); color: black;',
    );
  });

  it('Should support SLD 1.1.0', () => {
    openStyler();
    cy.get('hs-styles button[title="Reset to default style"]').click();
    cy.get('hs-styles button[title="Upload style as SLD file"]').click();
    cy.get('hs-styles input[type=file]').selectFile(
      'cypress/fixtures/sld-1.1.0.sld',
      {force: true},
    );
    cy.wait(500);
    cy.get('hs-rule-list-item').click();
    cy.get('hs-symbolizer-list-item').click();
    cy.get(
      'hs-symbolizer hs-symbolizer-color-picker[data-cy="mark-symbolizer-color"] input',
    ).should(
      'have.attr',
      'style',
      'background-color: rgb(190, 207, 80); color: black;',
    );
  });
});
