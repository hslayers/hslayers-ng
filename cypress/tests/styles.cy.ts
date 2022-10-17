describe('Hslayers application', () => {
  before(() => {
    cy.visit('/');
    //Open layer manager
    cy.get('.hs-sidebar-item[data-cy="layermanager"]').click();
    //Turn off all layers
    cy.get('hs-layermanager-layer-list li').each((layer) => {
      cy.wrap(layer).find('.d-flex div:first').click();
    });
  });

  it('Styler should open', () => {
    cy.get('.hs-lm-layerlist:not([hidden]):last .hs-lm-item:first')
      .find('.d-flex .info_btn')
      .click();
    cy.get('hs-layer-editor button[title="Style layer"]').click();
    cy.get('hs-rule-list-item').click();
    cy.get('hs-symbolizer-list-item').click();
    cy.get('hs-symbolizer').should('exist');
    cy.get('hs-symbolizer').should('have.length', 1);
    cy.get('hs-symbolizer hs-mark-symbolizer').should('exist');
    cy.get('hs-symbolizer hs-mark-symbolizer select:first').should(
      'have.attr',
      'ng-reflect-model',
      'circle'
    );
  });

  it('Style can be reset to default', () => {
    cy.get('hs-styles button[title="Reset to default style"]').click();
    cy.get('hs-symbolizer').should('not.exist');
    cy.get('hs-rule-list-item').click();
    cy.get('hs-symbolizer-list-item:first').click();
    cy.get(
      'hs-symbolizer hs-mark-symbolizer input[ng-reflect-model="#0099ff"]:first'
    ).should(
      'have.attr',
      'style',
      'background-color: rgb(0, 153, 255); color: white;'
    );
  });
});
