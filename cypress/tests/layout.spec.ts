describe('Hslayers layout', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should be able to click on basemap gallery icon button and click on OpenStreetMap layer', () => {
    cy.getBySel('basemap-gallery').eq(0).click();
    cy.getBySelLike('OpenStreetMap').eq(0).click();
  });

  it('should be able to click on Layermanager button', () => {
    cy.getBySel('layermanager').eq(0).click();
  });
});
