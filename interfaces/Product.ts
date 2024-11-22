import { MeasureUnit } from "./MeasureUnit";
import { Supplier } from "./Supplier";

export interface Product {
    id: string;
    sku: number;
    name: string;
    supplierId: string;
    measureUnitId: string;
    supplier?: Supplier;
    measureUnit?: MeasureUnit;
}