describe('Hslayers application', () => {
  it('Language panel should open', () => {
    cy.visit('/');
    cy.get('.hs-sidebar-additional-items:first').click();
    cy.get(
      'hs-mini-sidebar .hs-sidebar-item.hs-panel-hidden[data-cy="language"]',
    ).click();
    cy.get('hs-language .list-group .btn:last').click();
    cy.get('hs-language hs-panel-header').should(
      'have.attr',
      'ng-reflect-title',
      'Linguam mutare',
    );
    cy.get('hs-language hs-panel-header span').should(
      'contain.text',
      'Linguam mutare',
    );
  });

  it('App should open with a language other than the default', () => {
    cy.visit('/?hs-lang=cs');

    cy.get(
      'hs-some-panel > .card > hs-panel-header > .card-header > .flex-grow-1',
    ).should('contain.text', 'Můj úžasný panel');
  });
});
