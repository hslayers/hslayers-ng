import {servicesSupportedByUrl} from '../services-supported.const';

export type AddDataUrlType = (typeof servicesSupportedByUrl)[number];
//https://stackoverflow.com/questions/40863488/how-can-i-iterate-over-a-custom-literal-type-in-typescript
