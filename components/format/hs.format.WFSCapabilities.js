define(function(require) {
    var ol = require('ol');
    var caps = {};

    NAMESPACE_URIS_WFS_ = [
        null,
        'http://www.opengis.net/wfs/2.0',
        "http://www.opengis.net/ows/1.1"
    ];

    PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'ServiceIdentification': ol.xml.makeObjectPropertySetter(
                readServiceIdentification),
            'ServiceProvider': ol.xml.makeObjectPropertySetter(
                readServiceProvider),
            'OperationsMetadata': ol.xml.makeObjectPropertySetter(
                readOperationsMetadata),
            'FeatureTypeList': ol.xml.makeObjectPropertySetter(
                readFeatureTypeList)
        });

    function readServiceIdentification(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'ServiceIdentification',
            'localName should be ServiceIdentification');
        return ol.xml.pushParseAndPop({}, SERVICE_PARSERS_, node, objectStack);
    };

    SERVICE_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
            'Abstract': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
            'Keywords': ol.xml.makeObjectPropertySetter(
                readKeywordList),
            'ServiceType': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
            'ServiceTypeVersion': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
            'Fees': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
            'AccessConstraints': ol.xml.makeObjectPropertySetter(
                ol.format.XSD.readString),
        });

    function readServiceProvider(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'ServiceProvider',
            'localName should be ServiceProvider');
        //return ol.xml.pushParseAndPop({}, SERVICE_PROVIDER_PARSERS_, node, objectStack);
    };

    function readOperationsMetadata(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'OperationsMetadata',
            'localName should be OperationsMetadata');
        return ol.xml.pushParseAndPop({}, SERVICE_OPERATIONS_METADATA_PARSERS_, node, objectStack);
    };

    SERVICE_OPERATIONS_METADATA_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'Operation': ol.xml.makeObjectPropertyPusher(readOperation),
            'Parameter': ol.xml.makeObjectPropertyPusher(readParameter),
            'Constraint': ol.xml.makeObjectPropertyPusher(readConstraint),
        });

    function readFeatureTypeList(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'FeatureTypeList',
            'localName should be Capability');
        return ol.xml.pushParseAndPop({}, FEATURE_TYPELIST_PARSERS_, node, objectStack);
    };

    FEATURE_TYPELIST_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'FeatureType': ol.xml.makeObjectPropertyPusher(
                readFeatureType)
        });

    function readFeatureType(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'FeatureType',
            'localName should be Capability');
        return ol.xml.pushParseAndPop({}, FEATURE_TYPE_PARSERS_, node, objectStack);
    };

    FEATURE_TYPE_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'Name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
            'Title': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
            'Abstract': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
            'Keywords': ol.xml.makeObjectPropertySetter(
                readKeywordList),
            'DefaultCRS': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
            'OtherCRS': ol.xml.makeObjectPropertyPusher(ol.format.XSD.readString),
            'OutputFormats': ol.xml.makeObjectPropertySetter(
                readOutputFormats),
            'WGS84BoundingBox': ol.xml.makeObjectPropertyPusher(
                readWGS84BoundingBox),
            'MetadataURL': ol.xml.makeObjectPropertySetter(
                ol.format.XLink.readHref)
        });

    function readOperation(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'Operation',
            'localName should be Operation');
        var operation = ol.xml.pushParseAndPop({}, OPERATIONTYPE_PARSERS_, node, objectStack);
        operation.name = node.getAttribute('name');
        return operation;
    }

    OPERATIONTYPE_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'DCP': ol.xml.makeObjectPropertyPusher(
                readDCPType_)
        });

    function readParameter(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'Parameter',
            'localName should be Parameter');
        //        var parameter = ol.xml.pushParseAndPop({},PARAMETERTYPE_PARSERS_, node, objectStack);
        var parameter = {};
        parameter.name = node.getAttribute('name');
        return parameter;
    }

    function readConstraint(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'Constraint',
            'localName should be Constraint');
        //        var constraint = ol.xml.pushParseAndPop({},CONSTRAINTTYPE_PARSERS_, node, objectStack);
        var constraint = {};
        constraint.name = node.getAttribute('name');
        return constraint;
    }

    function readDCPType_(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'DCP',
            'localName should be DCPType');
        return ol.xml.pushParseAndPop({}, DCPTYPE_PARSERS_, node, objectStack);
    };

    DCPTYPE_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'HTTP': ol.xml.makeObjectPropertySetter(
                readHTTP_)
        });

    function readHTTP_(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'HTTP', 'localName should be HTTP');
        return ol.xml.pushParseAndPop({}, HTTP_PARSERS_, node, objectStack);
    };

    HTTP_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'Get': ol.xml.makeObjectPropertySetter(
                ol.format.XLink.readHref),
            'Post': ol.xml.makeObjectPropertySetter(
                ol.format.XLink.readHref)
        });

    FORMAT_ONLINERESOURCE_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'OnlineResource': ol.xml.makeObjectPropertySetter(
                ol.format.XLink.readHref)
        });

    function readOutputFormats(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'OutputFormats',
            'localName should be OutputFormats');
        return ol.xml.pushParseAndPop(
            [], OUTPUTFORMATS_PARSERS_, node, objectStack);
    };

    OUTPUTFORMATS_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'Format': ol.xml.makeArrayPusher(ol.format.XSD.readString)
        });

    function readWGS84BoundingBox(node, objectStack) {

    }

    function readKeywordList(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        goog.asserts.assert(node.localName == 'Keywords',
            'localName should be Keywords');
        return ol.xml.pushParseAndPop(
            [], KEYWORDLIST_PARSERS_, node, objectStack);
    };

    KEYWORDLIST_PARSERS_ = ol.xml.makeStructureNS(
        NAMESPACE_URIS_WFS_, {
            'Keyword': ol.xml.makeArrayPusher(ol.format.XSD.readString)
        });

    function readContactInformation(node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType shpuld be ELEMENT');
        goog.asserts.assert(node.localName == 'ContactInformation',
            'localName should be ContactInformation');
        return ol.xml.pushParseAndPop({}, CONTACT_INFORMATION_PARSERS_,
            node, objectStack);
    };

    function readFromDocument(doc) {
        for (var n = doc.firstChild; n; n = n.nextSibling) {
            if (n.nodeType == goog.dom.NodeType.ELEMENT) {
                return readFromNode(n);
            }

            function readFromNode(node) {
                goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
                    'node.nodeType should be ELEMENT');
                goog.asserts.assert(node.localName == 'WFS_Capabilities',
                    'localName should be WFS_Capabilities');
                caps.version = node.getAttribute('version').trim();
                goog.asserts.assertString(caps.version, 'caps.version should be a string');
                var capabilityObject = ol.xml.pushParseAndPop({
                    'version': caps.version
                }, PARSERS_, node, []);
                return capabilityObject ? capabilityObject : null;
            };
        }
        return null;
    }
    return function(xml) {
        var doc = new ol.xml.parse(xml);
        object = readFromDocument(doc);
        return object;
    };
});
