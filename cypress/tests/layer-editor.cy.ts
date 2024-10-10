describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
    //Open layer manager
    cy.get('.hs-sidebar-item[data-cy="layerManager"]').click();
  });

  it('Should not be possible to change base/thematic type for vector layer', () => {
    cy.get('[data-test="Points"] span.icon-settingsthree-gears ').click();
    cy.get('hs-layer-editor form').within(() => {
      cy.get('hs-layer-type-switcher-widget').should('exist');
      cy.get('hs-layer-type-switcher-widget div').should('not.exist');
    });
  });

  it('Should be possible to find base/thematic type toggle for WMS layer', () => {
    cy.get('[data-test="EVI"] span.icon-settingsthree-gears ').click();
    cy.get('hs-layer-editor form').within(() => {
      cy.get('hs-layer-type-switcher-widget div').should('exist');
    });
  });

  it.only('Should be possible to change type of WMS layer back and forth', () => {
    cy.get('[data-test="EVI"] span.icon-settingsthree-gears ').click();

    //Change to BASE
    cy.get('hs-layer-editor form hs-layer-type-switcher-widget div')
      .find('button')
      .contains('Basemap')
      .should('exist')
      .click();

    cy.get('.modal-footer').find('button').contains('Yes').click();

    cy.get('.hs-lm-mapcontentlist .hs-lm-item-title').should(
      'not.contain',
      'EVI',
    );

    cy.get('.galleryButton').click();
    cy.get('.galleryDropdown .dropdown-item').should('contain', 'EVI');

    //Change to thematic
    cy.get('.galleryDropdown .dropdown-item')
      .contains('EVI')
      .parent()
      .within(() => {
        cy.get('div').click();
      });
    cy.get('hs-layer-type-switcher-widget div')
      .find('button')
      .contains('Thematic map')
      .should('exist')
      .click();
    cy.get('.modal-footer').find('button').contains('Yes').click();
    cy.get('.hs-lm-mapcontentlist .hs-lm-item-title').should('contain', 'EVI');
  });
});
