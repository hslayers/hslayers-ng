/* Common types */
declare type NameType = string;
declare type TitleType = string;
declare type AbstractType = string;
declare type KeywordType =
  | string
  | {
      vocabulary?: string;
    };
declare type KeywordListType = KeywordType[];
declare type OnlineResourceType = string; // URL
declare type FormatType = string;

/* Contact type */
declare type ContactInformationType = {
  ContactPersonPrimary?: {
    ContactPerson: string;
    ContactOrganization: string;
  };
  ContactPosition?: string;
  ContactAddress?: {
    AddressType: string;
    Address: string;
    City: string;
    StateOrProvince: string;
    PostCode: string;
    Country: string;
  };
  ContactVoiceTelephone?: string;
  ContactFacsimileTelephone?: string;
  ContactElectronicMailAddress?: string;
};

/* Capability types */
declare type DCPTypeType = {
  HTTP: {
    Get: OnlineResourceType;
    Post?: OnlineResourceType;
  };
};
declare type OperationTypeType = {
  Format: FormatType | FormatType[];
  DCPType: DCPTypeType | DCPTypeType[];
};

/* Layer types */
declare type CRSType = string;
declare type EX_GeographicBoundingBoxType = {
  westBoundLongitude?: number; //range restriction to [-180, 180] not yet supported by TS
  eastBoundLongitude?: number; //range restriction to [-180, 180] not yet supported by TS
  southBoundLatitude?: number; //range restriction to [-90, 90] not yet supported by TS
  northBoundLatitude?: number; //range restriction to [-90, 90] not yet supported by TS
};
declare type BoundingBoxType = {
  CRS: CRSType;
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;
  resx?: number;
  resy?: number;
};
declare type LogoURLType = {
  Format: FormatType;
  OnlineResource: OnlineResourceType;
  width: number; //UInt not yet supported by TS
  height: number; //UInt not yet supported by TS
};
declare type AttributionType = {
  Title?: TitleType;
  OnlineResource?: OnlineResourceType;
  LogoURL?: LogoURLType;
};
declare type MetadataURLType = {
  Format: FormatType;
  OnlineResource: OnlineResourceType;
  type; //NMTOKEN type
};
declare type AuthorityURLType = {
  OnlineResource: OnlineResourceType;
  name; //NMTOKEN type
};
declare type IdentifierType = {
  authority: string;
};
declare type DataURLType = {
  Format: FormatType;
  OnlineResource: OnlineResourceType;
};
declare type FeatureListURLType = DataURLType;
declare type LegendURLType = LogoURLType;
declare type StyleSheetURLType = DataURLType;
declare type StyleURLType = DataURLType;
declare type StyleType = {
  Name: NameType;
  Title: TitleType;
  Abstract?: AbstractType;
  LegendURL?: LegendURLType | LegendURLType[];
  StyleSheetURL?: StyleSheetURLType;
  StyleURL?: StyleURLType;
};
/**
 * Annex C "Handling multi-dimensional data"
 * and
 * https://github.com/openlayers/openlayers/blob/a8b949a802c4d79ce6fbdcbb2fe3828a83e375b3/src/ol/format/WMSCapabilities.js#L502
 */
export type WmsDimension = {
  name: string;
  units: string;
  unitSymbol?: string;
  default?: string;
  multipleValues?: boolean;
  nearestValue?: boolean;
  current?: boolean;
  values: string | string[];
};

/**
 * HsLayers extension of default WMS Layer object
 */
// eslint-disable-next-line no-use-before-define
export type HsWmsLayer = WmsLayer & {
  maxResolution: number;
};

export type WmsLayer = {
  Name?: NameType;
  Title: TitleType;
  Abstract?: AbstractType;
  KeywordList?: KeywordListType;
  CRS: CRSType | CRSType[];
  EX_GeographicBoundingBox?: EX_GeographicBoundingBoxType;
  BoundingBox?: BoundingBoxType | BoundingBoxType[];
  Dimension?: WmsDimension | WmsDimension[];
  Attribution?: AttributionType;
  AuthorityURL?: AuthorityURLType | AuthorityURLType[];
  Identifier?: IdentifierType | IdentifierType[];
  MetadataURL?: MetadataURLType | MetadataURLType[];
  DataURL?: DataURLType | DataURLType[];
  FeatureListURL?: FeatureListURLType | FeatureListURLType[];
  Style?: StyleType | StyleType[];
  MinScaleDenominator?: number;
  MaxScaleDenominator?: number;
  Layer?: HsWmsLayer | HsWmsLayer[];
  queryable?: boolean;
  cascaded?: number; // UInt not yet supported by TS
  opaque?: boolean;
  noSubsets?: boolean;
  fixedWidth?: number; // UInt not yet supported by TS
  fixedHeight?: number; // UInt not yet supported by TS
};

/**
 * Reference: OpenGIS® Web Map Server Implementation Specification. Version: 1.3.0. OGC® 06-042.
 */
export interface WMSGetCapabilitiesResponse {
  Service: {
    Name: 'WMS';
    Title: TitleType;
    Abstract?: AbstractType;
    KeywordList?: KeywordListType;
    OnlineResource: OnlineResourceType;
    ContactInformation?: ContactInformationType;
    Fees?: string;
    AccessConstraints?: string;
    LayerLimit?: number; // UInt not yet supported by TS
    MaxWidth?: number; // UInt not yet supported by TS
    MaxHeight?: number; // UInt not yet supported by TS
  };
  Capability: {
    Request: {
      GetCapabilities: OperationTypeType;
      GetMap: OperationTypeType;
      GetFeatureInfo?: OperationTypeType;
      [_ExtendedOperation: string]: OperationTypeType;
    };
    Exception: {
      Format: FormatType | FormatType[];
    };
    [_ExtendedCapabilities: string]: unknown;
    Layer?: HsWmsLayer; // | WmsLayer[]; ?
  };
  /**
   * capitalized version invalid by definition, but probably used in some services
   */
  Version: string;
  version: string;
  updateSequence?: string;
}
