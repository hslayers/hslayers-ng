describe('Hslayers application', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Language panel should open', () => {
    cy.get('.hs-sidebar-additional-items:first').click();
    cy.get(
      'hs-mini-sidebar .hs-sidebar-item.hs-panel-hidden[data-cy="language"]',
    ).click();
    cy.get('hs-language .list-group .btn:last').click();
    cy.get('hs-language hs-panel-header').should(
      'have.attr',
      'ng-reflect-title',
      'Nomainīt valodu',
    );
    cy.get('hs-language hs-panel-header span').should(
      'contain.text',
      'Nomainīt valodu',
    );
  });
});
