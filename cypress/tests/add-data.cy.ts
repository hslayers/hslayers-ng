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
  });

  it('Add data panel should open', () => {
    cy.get(
      'hs-sidebar .hs-sidebar-item:not(.hs-panel-hidden)[data-cy="addData"]'
    ).click();
    cy.get(`hs-panel-header[name="addData"]`).should('be.visible');
  });

  it('Wms panel should open', () => {
    cy.get('hs-add-data ul[role="tablist"] li:nth-child(2n) a').click();
    cy.get(`hs-add-data-url>.d-flex>.container>.row>button:first`).click();
  });

  it('Wms capabilities should be retrieved', () => {
    cy.get(`hs-url-wms hs-common-url input`).type(
      'https://hub.lesprojekt.cz/geoserver/leitnerfilip_wms/ows'
    );
    cy.get(`hs-url-wms hs-common-url input + button`).click();
    cy.wait(1000);
    cy.get('hs-layer-table table tr').should('have.length.above', 0);
  });

  it('Layer should be added', () => {
    cy.get('hs-layer-table table tr:first input[type="checkbox"]').click();
    cy.get('hs-layer-table table tr td:nth-child(2n)').then(($td) => {
      const layerName = $td.html();
      cy.get('button[title="Add selected layers to the map"').click();
      cy.get(`hs-panel-header[name="layermanager"]`).should('be.visible');
      cy.get(
        'hs-layermanager-layer-list li:first .d-flex button.hs-lm-item-visibility'
      ).should('have.class', 'hs-checkmark');
      cy.get('hs-layermanager-layer-list li:first .hs-lm-item-title').should(
        'have.text',
        ` ${layerName} ` //Extra padding around title
      );
    });
  });

  it('Layer should be visible on map', () => {
    cy.wait(500); //Need to wait for failed layman request error toast to disappear if HsConfig.errorToastDuration is large
    cy.get('.hs-ol-map').matchImage();
  });
});
