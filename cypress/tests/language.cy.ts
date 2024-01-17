describe('Hslayers application', () => {
  it('Language panel should open', () => {
    cy.visit('/');
    cy.get('.hs-sidebar-additional-items:first').click();
    cy.get(
      'hs-mini-sidebar .hs-sidebar-item.hs-panel-hidden[data-cy="language"]',
    ).click();
    cy.get('hs-language .list-group .btn:last').click();
    cy.get('hs-language hs-panel-header a.nav-link').should(
      'contain.text',
      'Linguam mutare',
    );
  });

  it('App should open with a language other than the default', () => {
    cy.visit('/?hs-lang=cs');

    cy.get('hs-some-panel hs-panel-header a.nav-link').should(
      'contain.text',
      'Můj úžasný panel',
    );
  });
});
