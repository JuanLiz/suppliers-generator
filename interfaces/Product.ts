import { MeasureUnit } from "./MeasureUnit";
import { Provider } from "./Provider";

export interface Product {
    id: string;
    sku: number;
    name: string;
    providerId: number;
    measureUnitId: number;
    provider?: Provider;
    measureUnit?: MeasureUnit;
}