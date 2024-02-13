export const wmsGetCapabilitiesResponse = `<?xml version='1.0' encoding="UTF-8" standalone="no" ?>
<WMS_Capabilities version="1.3.0"  xmlns="http://www.opengis.net/wms"   xmlns:sld="http://www.opengis.net/sld"   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"   xmlns:ms="http://mapserver.gis.umn.edu/mapserver"   xmlns:inspire_common="http://inspire.ec.europa.eu/schemas/common/1.0"   xmlns:inspire_vs="http://inspire.ec.europa.eu/schemas/inspire_vs/1.0"   xsi:schemaLocation="http://www.opengis.net/wms http://schemas.opengeospatial.net/wms/1.3.0/capabilities_1_3_0.xsd  http://www.opengis.net/sld http://schemas.opengeospatial.net/sld/1.1.0/sld_capabilities.xsd  http://inspire.ec.europa.eu/schemas/inspire_vs/1.0  http://inspire.ec.europa.eu/schemas/inspire_vs/1.0/inspire_vs.xsd http://mapserver.gis.umn.edu/mapserver http://geoservices.brgm.fr/geologie?language=fre&amp;service=WMS&amp;version=1.3.0&amp;request=GetSchemaExtension">

<!-- MapServer version 6.5-dev OUTPUT=PNG OUTPUT=JPEG SUPPORTS=PROJ SUPPORTS=AGG SUPPORTS=FREETYPE SUPPORTS=CAIRO SUPPORTS=SVG_SYMBOLS SUPPORTS=SVGCAIRO SUPPORTS=ICONV SUPPORTS=FRIBIDI SUPPORTS=WMS_SERVER SUPPORTS=WMS_CLIENT SUPPORTS=WFS_SERVER SUPPORTS=WFS_CLIENT SUPPORTS=WCS_SERVER SUPPORTS=SOS_SERVER SUPPORTS=FASTCGI SUPPORTS=GEOS INPUT=JPEG INPUT=POSTGIS INPUT=ORACLESPATIAL INPUT=OGR INPUT=GDAL INPUT=SHAPEFILE -->

<Service>
  <Name>WMS</Name>
  <Title>GéoServices : géologie, hydrogéologie et gravimétrie</Title>
  <Abstract>Ensemble des services d&#39;accès aux données sur la géologie, l&#39;hydrogéologie et la gravimétrie, diffusées par le BRGM</Abstract>
  <KeywordList>
      <Keyword>Géologie</Keyword>
      <Keyword>BRGM</Keyword>
      <Keyword>INSPIRE:ViewService</Keyword>
      <Keyword>infoMapAccessService</Keyword>
      <Keyword vocabulary="ISO">infoMapAccessService</Keyword>
      <Keyword vocabulary="ISO">WMS 1.1.1</Keyword>
      <Keyword vocabulary="ISO">WMS 1.3.0</Keyword>
      <Keyword vocabulary="ISO">SLD 1.1.0</Keyword>
  </KeywordList>
  <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie"/>
  <ContactInformation>
    <ContactPersonPrimary>
      <ContactPerson>Support BRGM</ContactPerson>
      <ContactOrganization>BRGM</ContactOrganization>
    </ContactPersonPrimary>
      <ContactPosition>pointOfContact</ContactPosition>
    <ContactAddress>
        <AddressType>postal</AddressType>
        <Address>3, Avenue Claude Guillemin, BP36009</Address>
        <City>Orléans</City>
        <StateOrProvince>Centre</StateOrProvince>
        <PostCode>45060</PostCode>
        <Country>France</Country>
    </ContactAddress>
      <ContactVoiceTelephone>+33(0)2 38 64 34 34</ContactVoiceTelephone>
      <ContactFacsimileTelephone>+33(0)2 38 64 35 18</ContactFacsimileTelephone>
  <ContactElectronicMailAddress>contact-brgm@brgm.fr</ContactElectronicMailAddress>
  </ContactInformation>
  <Fees>no conditions apply</Fees>
  <AccessConstraints>None</AccessConstraints>
  <MaxWidth>4096</MaxWidth>
  <MaxHeight>4096</MaxHeight>
</Service>

<Capability>
  <Request>
    <GetCapabilities>
      <Format>text/xml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Post>
        </HTTP>
      </DCPType>
    </GetCapabilities>
    <GetMap>
      <Format>image/png</Format>
      <Format>image/gif</Format>
      <Format>image/jpeg</Format>
      <Format>image/ecw</Format>
      <Format>image/tiff</Format>
      <Format>image/png; mode=8bit</Format>
      <Format>application/x-pdf</Format>
      <Format>image/svg+xml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Post>
        </HTTP>
      </DCPType>
    </GetMap>
    <GetFeatureInfo>
      <Format>text/plain</Format>
      <Format>application/vnd.ogc.gml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Post>
        </HTTP>
      </DCPType>
    </GetFeatureInfo>
    <sld:DescribeLayer>
      <Format>text/xml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Post>
        </HTTP>
      </DCPType>
    </sld:DescribeLayer>
    <sld:GetLegendGraphic>
      <Format>image/png</Format>
      <Format>image/gif</Format>
      <Format>image/jpeg</Format>
      <Format>image/png; mode=8bit</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Post>
        </HTTP>
      </DCPType>
    </sld:GetLegendGraphic>
    <ms:GetStyles>
      <Format>text/xml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Get>
          <Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;"/></Post>
        </HTTP>
      </DCPType>
    </ms:GetStyles>
  </Request>
  <Exception>
    <Format>XML</Format>
    <Format>INIMAGE</Format>
    <Format>BLANK</Format>
  </Exception>
  <sld:UserDefinedSymbolization SupportSLD="1" UserLayer="0" UserStyle="1" RemoteWFS="0" InlineFeature="0" RemoteWCS="0"/>
  <inspire_vs:ExtendedCapabilities>
    <inspire_common:MetadataUrl xsi:type="inspire_common:resourceLocatorType">
      <inspire_common:URL>		http://www.geocatalogue.fr/api-public/servicesRest?Service=CSW&amp;Request=GetRecordById&amp;Version=2.0.2&amp;id=3a6fbbd8-e99a-477a-9614-945ce1a21219&amp;outputSchema=http://www.isotc211.org/2005/gmd&amp;elementSetName=full</inspire_common:URL>
      <inspire_common:MediaType>application/vnd.ogc.csw.capabilities.response_xml</inspire_common:MediaType>
    </inspire_common:MetadataUrl>
    <inspire_common:SupportedLanguages>
      <inspire_common:DefaultLanguage><inspire_common:Language>fre</inspire_common:Language></inspire_common:DefaultLanguage>
    </inspire_common:SupportedLanguages>
    <inspire_common:ResponseLanguage><inspire_common:Language>fre</inspire_common:Language></inspire_common:ResponseLanguage>
  </inspire_vs:ExtendedCapabilities>
  <Layer>
    <Name>GEOSERVICES_GEOLOGIE</Name>
    <Title>GéoServices : géologie, hydrogéologie et gravimétrie</Title>
    <Abstract>Ensemble des services d&#39;accès aux données sur la géologie, l&#39;hydrogéologie et la gravimétrie, diffusées par le BRGM</Abstract>
    <KeywordList>
        <Keyword>Géologie</Keyword>
        <Keyword>BRGM</Keyword>
        <Keyword>INSPIRE:ViewService</Keyword>
        <Keyword>infoMapAccessService</Keyword>
        <Keyword vocabulary="ISO">infoMapAccessService</Keyword>
        <Keyword vocabulary="ISO">WMS 1.1.1</Keyword>
        <Keyword vocabulary="ISO">WMS 1.3.0</Keyword>
        <Keyword vocabulary="ISO">SLD 1.1.0</Keyword>
    </KeywordList>
    <CRS>EPSG:4326</CRS>
    <CRS>CRS:84</CRS>
    <CRS>EPSG:3857</CRS>
    <CRS>EPSG:4171</CRS>
    <EX_GeographicBoundingBox>
        <westBoundLongitude>-180</westBoundLongitude>
        <eastBoundLongitude>180</eastBoundLongitude>
        <southBoundLatitude>-90</southBoundLatitude>
        <northBoundLatitude>90</northBoundLatitude>
    </EX_GeographicBoundingBox>
    <BoundingBox CRS="EPSG:4326"
                minx="-90" miny="-180" maxx="90" maxy="180" />
    <BoundingBox CRS="CRS:84"
                minx="-180" miny="-90" maxx="180" maxy="90" />
    <BoundingBox CRS="EPSG:3857"
                minx="-1e+15" miny="-1e+15" maxx="1e+15" maxy="1e+15" />
    <Attribution>
        <Title>Brgm</Title>
        <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://www.brgm.fr/"/>
        <LogoURL width="143" height="50">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapsref.brgm.fr/legendes/brgm_logo.png"/>
          </LogoURL>
    </Attribution>
    <Style>
       <Name>default</Name>
       <Title>default</Title>
       <LegendURL width="729" height="9325">
          <Format>image/png</Format>
          <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://geoservices.brgm.fr/geologie?language=fre&amp;version=1.3.0&amp;service=WMS&amp;request=GetLegendGraphic&amp;sld_version=1.1.0&amp;layer=GEOSERVICES_GEOLOGIE&amp;format=image/png&amp;STYLE=default"/>
       </LegendURL>
    </Style>
    <Layer>
      <Name>GEOLOGIE</Name>
      <Title>Cartes géologiques</Title>
      <Abstract>Cartes géologiques</Abstract>
    <Style>
       <Name>default</Name>
       <Title>default</Title>
    </Style>
      <Layer queryable="0" opaque="0" cascaded="0">
        <Name>SCAN_F_GEOL1M</Name>
        <Title>Carte géologique image de la France au million</Title>
        <Abstract>BD Scan-Million-Géol est la base de données géoréférencées de la carte géologique image à 1/1 000 000</Abstract>
        <KeywordList>
            <Keyword>Geologie</Keyword>
            <Keyword>INSPIRE:Geology</Keyword>
            <Keyword vocabulary="ISO">Geology</Keyword>
        </KeywordList>
        <CRS>EPSG:4326</CRS>
        <CRS>EPSG:3857</CRS>
        <CRS>CRS:84</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-5.86764</westBoundLongitude>
            <eastBoundLongitude>11.0789</eastBoundLongitude>
            <southBoundLatitude>41.1701</southBoundLatitude>
            <northBoundLatitude>51.1419</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="41.1701" miny="-5.86764" maxx="51.1419" maxy="11.0789" />
        <BoundingBox CRS="EPSG:3857"
                    minx="-653183" miny="5.03746e+06" maxx="1.2333e+06" maxy="6.64644e+06" />
        <BoundingBox CRS="CRS:84"
                    minx="-5.86764" miny="41.1701" maxx="11.0789" maxy="51.1419" />
    <Attribution>
        <Title>BRGM</Title>
        <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://www.brgm.fr"/>
        <LogoURL width="158" height="82">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapsref.brgm.fr/legendes/brgm_logo.png"/>
          </LogoURL>
    </Attribution>
        <AuthorityURL name="BRGM">
          <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="www.brgm.fr"/>
        </AuthorityURL>
        <Identifier authority="BRGM">http://id.geocatalogue.fr/BR_CAR_ADA</Identifier>
        <MetadataURL type="TC211">
          <Format>text/xml</Format>
          <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://www.geocatalogue.fr/api-public/servicesRest?Service=CSW&amp;Request=GetRecordById&amp;Version=2.0.2&amp;id=BR_CAR_ADA&amp;outputSchema=http://www.isotc211.org/2005/gmd&amp;elementSetName=full"/>
        </MetadataURL>
        <Style>
          <Name>inspire_common:DEFAULT</Name>
          <Title>inspire_common:DEFAULT</Title>
          <LegendURL width="600" height="732">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapsref.brgm.fr/legendes/geoservices/Geologie1000_legende.jpg"/>
          </LegendURL>
        </Style>
        <MinScaleDenominator>200000</MinScaleDenominator>
        <MaxScaleDenominator>1e+07</MaxScaleDenominator>
      </Layer>
      <Layer queryable="0" opaque="0" cascaded="0">
        <Name>SCAN_F_GEOL250</Name>
        <Title>Carte géologique image de la France au 1/250000</Title>
        <Abstract>BD Scan-Géol-250 est la base de données géoréférencées des cartes géologiques image à 1/250 000. Utilisation scientifique, technique, pédagogique</Abstract>
        <KeywordList>
            <Keyword>Geologie</Keyword>
            <Keyword>INSPIRE:Geology</Keyword>
            <Keyword vocabulary="ISO">Geology</Keyword>
        </KeywordList>
        <CRS>EPSG:4326</CRS>
        <CRS>EPSG:3857</CRS>
        <CRS>CRS:84</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-6.20495</westBoundLongitude>
            <eastBoundLongitude>12.2874</eastBoundLongitude>
            <southBoundLatitude>41.9671</southBoundLatitude>
            <northBoundLatitude>51.2917</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="41.9671" miny="-6.20495" maxx="51.2917" maxy="12.2874" />
        <BoundingBox CRS="EPSG:3857"
                    minx="-690732" miny="5.15606e+06" maxx="1.36783e+06" maxy="6.67306e+06" />
        <BoundingBox CRS="CRS:84"
                    minx="-6.20495" miny="41.9671" maxx="12.2874" maxy="51.2917" />
    <Attribution>
        <Title>BRGM</Title>
        <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://www.brgm.fr"/>
        <LogoURL width="158" height="82">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapsref.brgm.fr/legendes/brgm_logo.png"/>
          </LogoURL>
    </Attribution>
        <AuthorityURL name="BRGM">
          <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="www.brgm.fr"/>
        </AuthorityURL>
        <Identifier authority="BRGM">http://id.geocatalogue.fr/BR_CAR_ACA</Identifier>
        <MetadataURL type="TC211">
          <Format>text/xml</Format>
          <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://www.geocatalogue.fr/api-public/servicesRest?Service=CSW&amp;Request=GetRecordById&amp;Version=2.0.2&amp;id=BR_CAR_ACA&amp;outputSchema=http://www.isotc211.org/2005/gmd&amp;elementSetName=full"/>
        </MetadataURL>
        <MinScaleDenominator>80000</MinScaleDenominator>
        <MaxScaleDenominator>500000</MaxScaleDenominator>
      </Layer>
      <Layer queryable="0" opaque="0" cascaded="0">
        <Name>SCAN_D_GEOL50</Name>
        <Title>Carte géologique image de la France au 1/50 000e</Title>
        <Abstract>BD Scan-Géol-50 est la base de données géoréférencées des cartes géologiques &#39;papier&#39; à 1/50 000</Abstract>
        <KeywordList>
            <Keyword>Geologie</Keyword>
            <Keyword>INSPIRE:Geology</Keyword>
            <Keyword vocabulary="ISO">Geology</Keyword>
        </KeywordList>
        <CRS>EPSG:4326</CRS>
        <CRS>EPSG:3857</CRS>
        <CRS>CRS:84</CRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>-12.2064</westBoundLongitude>
            <eastBoundLongitude>11.894</eastBoundLongitude>
            <southBoundLatitude>40.681</southBoundLatitude>
            <northBoundLatitude>52.1672</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox CRS="EPSG:4326"
                    minx="40.681" miny="-12.2064" maxx="52.1672" maxy="11.894" />
        <BoundingBox CRS="EPSG:3857"
                    minx="-1.35881e+06" miny="4.96541e+06" maxx="1.32403e+06" maxy="6.83041e+06" />
        <BoundingBox CRS="CRS:84"
                    minx="-12.2064" miny="40.681" maxx="11.894" maxy="52.1672" />
    <Attribution>
        <Title>BRGM</Title>
        <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://www.brgm.fr"/>
        <LogoURL width="158" height="82">
             <Format>image/png</Format>
             <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://mapsref.brgm.fr/legendes/brgm_logo.png"/>
          </LogoURL>
    </Attribution>
        <AuthorityURL name="BRGM">
          <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="www.brgm.fr"/>
        </AuthorityURL>
        <Identifier authority="BRGM">http://id.geocatalogue.fr/72cc8d40-1bb6-41a3-8376-9734f23336ff</Identifier>
        <MetadataURL type="TC211">
          <Format>text/xml</Format>
          <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://www.geocatalogue.fr/api-public/servicesRest?Service=CSW&amp;Request=GetRecordById&amp;Version=2.0.2&amp;id=72cc8d40-1bb6-41a3-8376-9734f23336ff&amp;outputSchema=http://www.isotc211.org/2005/gmd&amp;elementSetName=full"/>
        </MetadataURL>
        <MinScaleDenominator>9000</MinScaleDenominator>
        <MaxScaleDenominator>251000</MaxScaleDenominator>
      </Layer>
    </Layer>
  </Layer>
</Capability>
</WMS_Capabilities>`;
