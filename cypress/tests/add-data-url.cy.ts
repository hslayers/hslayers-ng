function checkIfLayerAdded(layerName) {
  cy.get(`hs-panel-header[name="layermanager"]`).should('be.visible');
  cy.get(
    'hs-layermanager-layer-list li:first .d-flex button.hs-lm-item-visibility'
  ).should('have.class', 'hs-checkmark');
  cy.get('hs-layermanager-layer-list li:first .hs-lm-item-title').should(
    'have.text',
    ` ${layerName} ` //Extra padding around title
  );
}

function addLayerAndCheckIfAdded() {
  cy.wait(2000);
  cy.get('hs-layer-table table tr').should('have.length.above', 0);

  //it('Layer should be added', () => {
  cy.get('hs-layer-table table tr:first input[type="checkbox"]').click();
  cy.get('hs-layer-table table tr td:nth-child(2n) span').then(($td) => {
    const layerName = $td.html();
    cy.get('button[title="Add selected layers to the map"').click();
    checkIfLayerAdded(layerName);
  });
}

function openPanelAndTypeTab(index) {
  //Open add-data panel
  cy.get(
    'hs-sidebar .hs-sidebar-item:not(.hs-panel-hidden)[data-cy="addData"]'
  ).click();
  cy.get(`hs-panel-header[name="addData"]`).should('be.visible');
  //Open corresponding type tab
  cy.get('hs-add-data ul[role="tablist"] li:nth-child(2n) a').click();
  cy.get(`hs-add-data-url>.d-flex>.container>.row>button`).eq(index).click();
}

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

  it('WMS layer should be visible on map', () => {
    openPanelAndTypeTab(0);
    //it('Wms capabilities should be retrieved', () => {
    cy.get(`hs-url-wms hs-common-url input`).type(
      'https://watlas.lesprojekt.cz/geoserver/filip_wms/ows'
    );
    cy.get(`hs-url-wms hs-common-url input + button`).click();
    addLayerAndCheckIfAdded();
    //it('Layer should be visible on map', () => {
    cy.wait(2000); //Need to wait for failed layman request error toast to disappear if HsConfig.errorToastDuration is large
    cy.get('.hs-ol-map').matchImage();
  });

  it('WMTS layer should be visible on map', () => {
    openPanelAndTypeTab(1);
    //it('Wtms capabilities should be retrieved', () => {
    cy.get(`hs-url-wmts hs-common-url input`).type(
      'https://gis.lesprojekt.cz/geoserver/gwc/service/wmts?'
    );
    cy.get(`hs-url-wmts hs-common-url input + button`).click();
    addLayerAndCheckIfAdded();
    //it('Layer should be visible on map', () => {
    cy.wait(2000);
    cy.get('.hs-ol-map').matchImage();
  });

  it('WFS layer should be visible on map', () => {
    openPanelAndTypeTab(2);

    //it('WFS capabilities should be retrieved', () => {
    cy.get(`hs-url-wfs hs-common-url input`).type(
      'https://watlas.lesprojekt.cz/geoserver/filip/wfs'
    );
    cy.get(`hs-url-wfs hs-common-url input + button`).click();
    addLayerAndCheckIfAdded();
    //it('Layer should be visible on map', () => {
    cy.wait(2000);
    cy.get('.hs-ol-map').matchImage();
  });

  it('geoJSON layer should be visible on map', () => {
    openPanelAndTypeTab(5);

    //it('WFS capabilities should be retrieved', () => {
    cy.get(`hs-url-vector hs-common-url input`).type(
      'https://gist.githubusercontent.com/wavded/1200773/raw/e122cf709898c09758aecfef349964a8d73a83f3/sample.json'
    );
    cy.get(`hs-url-vector hs-common-url input + button`).click();

    const layerName = 'Added geojson layer';
    cy.get(`input.form-control[name="name"]`).type(layerName);
    cy.get('.form-horizontal > :nth-child(2) > .btn-primary').should(
      'not.have.attr',
      'disabled'
    );
    cy.get('.form-horizontal > :nth-child(2) > .btn-primary').click();
    checkIfLayerAdded(layerName);
    //it('Layer should be visible on map', () => {
    cy.wait(2000);
    cy.get('.hs-ol-map').matchImage();
  });
});
