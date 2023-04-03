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

  it('Should be possible to reorder layer by draging', () => {
    cy.wrap(true).then(() => {
      if (!Cypress.isBrowser('chrome')) {
        cy.log(
          'Skipping layer reordering test. Works in Chromium browser only'
        );
        return;
      }
      cy.get(
        '.hs-main-panel:not([hidden]) hs-panel-header[name*="layermanager"] extra-buttons button:first'
      ).click();

      cy.get('.cdk-drop-list').then(($list) => {
        const toBeFirstLayerName = $list.find('.cdk-drag:nth-child(2) div p')[0]
          .innerHTML;
        cy.get('hs-layermanager-physical-layer-list .cdk-drag:first')
          .realMouseDown({button: 'left', position: 'center'})
          .realMouseMove(0, 10, {position: 'center'});
        cy.get('hs-layermanager-physical-layer-list .cdk-drag:nth-child(2)')
          .realMouseMove(0, 0, {position: 'center'})
          .realMouseUp();

        cy.get('.cdk-drop-list .cdk-drag:first div p').should(
          'have.html',
          toBeFirstLayerName
        );
      });
    });
  });
});
