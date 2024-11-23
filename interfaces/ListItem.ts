import { Product } from "./Product";
import { SupplierList } from "./SupplierList";

export interface ListItem {
    id?: string;
    supplierListId: string;
    productId: string;
    quantity: number;
    comment?: string;
    updatedAt?: Date;
    product: Product;
    supplierList: SupplierList;
}