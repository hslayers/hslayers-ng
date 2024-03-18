import {SERVICES_SUPPORTED_BY_URL} from './services-supported.const';

export type AddDataUrlType = (typeof SERVICES_SUPPORTED_BY_URL)[number];
//https://stackoverflow.com/questions/40863488/how-can-i-iterate-over-a-custom-literal-type-in-typescript
