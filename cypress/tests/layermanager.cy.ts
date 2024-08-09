describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);

    //Open layer manager
    cy.get('.hs-sidebar-item[data-cy="layerManager"]').click();
    //Turn off all layers
    cy.get('hs-layer-manager-layer-list li .d-flex button.hs-checkmark').each(
      (button) => {
        cy.wrap(button).click();
      },
    );
  });

  it('Should be possible to reorder layer by draging', () => {
    cy.wrap(true).then(() => {
      if (!Cypress.isBrowser('chrome')) {
        cy.log(
          'Skipping layer reordering test. Works in Chromium browser only',
        );
        return;
      }
      cy.get('[data-cy="mainButtonContainer"] > .btn').click();

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
          toBeFirstLayerName,
        );
      });
    });
  });

  it('Should remove all layers and then reset to default', () => {
    cy.get('hs-panel-header .dropdown-toggle').click();
    cy.get('.extra-buttons-container').should('be.visible');
    cy.get('extra-buttons a:first').click();

    const removeButton = cy
      .get('hs-rm-layer-dialog .modal-footer button')
      .first();
    removeButton.should('be.disabled');

    cy.get('.modal-body').find('button').contains('Toggle all').click();

    cy.get('.modal-footer button:first').click();

    cy.get('.hs-lm-mapcontentlist').children().should('have.length', 0); //All groups are removed

    cy.get('hs-panel-header .dropdown-toggle').click();
    cy.get('extra-buttons').find('a').contains('Reset map').click();

    cy.get('.hs-lm-mapcontentlist').children().should('have.length', 3); //All groups retrieved
  });

  it('Layermanager filter should hide layers', () => {
    cy.get('hs-layer-manager .hs-filter').type('EVI');
    cy.get('.hs-lm-mapcontentlist div.hs-lm-item-title').should(
      'have.length',
      1,
    );
    cy.get('.hs-lm-mapcontentlist div.hs-lm-item-title')
      .contains('EVI')
      .should('be.visible');
  });

  it('Should try to load WMS content outside the extent (eg. ignore the extent)', () => {
    //Enable EVI layer and zoom to its extent
    cy.get('[data-test="EVI"] button.hs-lm-item-visibility').click();
    cy.wait(2000);
    cy.get('[data-test="EVI"] span.icon-settingsthree-gears ').click();
    cy.get('.card-footer button[title="Zoom to layer"]').click();

    /**
     * Quite unreliable as the time necessary for the content to load can vary
     */
    cy.wait(7000);

    cy.intercept('GET', 'http://localhost:8087/geoserver/jmacura_wms/ows*').as(
      'myRequest',
    );

    //Zoom to different layer
    cy.get(
      '[data-test="Latvian municipalities (1 sub-layer)"] span.icon-settingsthree-gears ',
    ).click();
    cy.get('.card-footer button[title="Zoom to layer"]').click();

    //Expect no requests as view is outside the extent
    cy.get('@myRequest').then(($request) => {
      if ($request) {
        throw new Error('UNexpected getMap request was intercepted.');
      } else {
        //Ignore extent eg. allow requests to be made no matter the extent
        cy.get('[data-test="EVI"] span.icon-settingsthree-gears ').click();
        cy.get(
          'hs-layer-editor hs-extent-widget #hs-layer-extent-toggle',
        ).click();
        cy.wait('@myRequest').should('exist');
      }
    });

    // // Wait for the request to be made
    // cy.wait('@myRequest').should('exist');
  });
});
