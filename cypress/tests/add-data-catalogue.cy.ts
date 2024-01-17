function openAddDataPanel() {
  //Open add-data panel
  cy.get(
    'hs-sidebar .hs-sidebar-item:not(.hs-panel-hidden)[data-cy="addData"]',
  ).click();
  cy.get(`hs-panel-header[name="addData"]`).should('be.visible');
}

describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
    openAddDataPanel();
  });

  it('Number of layers in list should change to 5', () => {
    cy.wait(2000);
    cy.get('hs-add-data-catalogue .list-group hs-catalogue-list-item').then(
      ($el) => {
        if ($el.length > 0) {
          cy.get('[data-cy="hs-pager-menu-toggle"]').click();
          cy.get('hs-pager .dropdown-menu.show a').eq(0).click();
          cy.get(
            'hs-add-data-catalogue .list-group hs-catalogue-list-item',
          ).should('have.length', 5);
        } else {
          cy.log('Not enough layers in list. Passing');
        }
      },
    );
  });

  it('Layers should reorder', () => {
    cy.wait(2000);
    cy.get(
      'hs-add-data-catalogue .list-group hs-catalogue-list-item:last',
    ).then(($el) => {
      const layerNames = {
        'init': $el[0].querySelector('a').innerHTML,
      };
      cy.get('[data-cy="hs-addData-catalogue-filter"]').click();
      cy.get(
        '[data-cy="hs-addData-catalogue-filter"] .dropdown-menu-right > .p-1 > tbody > :nth-child(3) > .dropdown > .dropdown-toggle',
      ).click();
      cy.get(
        '[data-cy="hs-addData-catalogue-filter"] .dropdown-menu-right > .p-1 > tbody > :nth-child(3) > .dropdown > .ps-2 > :nth-child(2) > label',
      ).click();
      cy.get('[data-cy="hs-addData-catalogue-filter"]').click();
      cy.wait(2000);

      cy.get(
        'hs-add-data-catalogue .list-group hs-catalogue-list-item:last',
      ).then((elem) => {
        layerNames['sorted'] = elem[0].querySelector('a').innerHTML;
        for (const name of Object.entries(layerNames)) {
          expect(name).to.exist;
        }
        expect(layerNames['init']).to.not.eq(layerNames['sorted']);
      });
    });
  });

  it('Searching for noresultexpected should yield 0 results', () => {
    cy.get(
      '.hs-add-data-catalogue-header > .mt-3 > .input-group > .form-control',
    ).type('noresultexpected');
    cy.wait(1000);
    cy.get('hs-add-data-catalogue .list-group hs-catalogue-list-item').should(
      'have.length',
      0,
    );
  });

  it('Should be possible to add layer', () => {
    cy.wait(2000);
    cy.get(
      'hs-add-data-catalogue .list-group hs-catalogue-list-item:first',
    ).click();
    cy.get('.hs-catalogue-item-body div div.btn-group span:not(.hs-loader)')
      .should('have.html', 'Add to map')
      .click();
    //Should switch to Layermanager
    cy.get(
      '.hs-main-panel:not([hidden]) hs-panel-header[name*="layerManager"]',
    ).should('exist');
  });

  it('Should be possible to add layer as WMST/WMTS/WFS', () => {
    cy.wait(2000);
    cy.get(
      'hs-add-data-catalogue .list-group hs-catalogue-list-item:first',
    ).click();
    cy.get('.hs-catalogue-item-body div div button.dropdown-toggle').click();

    cy.get('[title*="What does it mean?"]:first').should('exist').click();
    cy.get('hs-catalogue-list-item div[data-toggle="buttons"] label').should(
      'have.length',
      3,
    );
    cy.get(
      'hs-catalogue-list-item div[data-toggle="buttons"] label:first',
    ).click();

    // //Should switch to Layermanager
    cy.get(
      '.hs-main-panel:not([hidden]) hs-panel-header[name*="layerManager"]',
    ).should('exist');
  });
});
