import { Product } from "./Product";

export interface ListItem {
    id?: string;
    supplierListId: string;
    productId: string;
    quantity: number;
    comment?: string;
    product: Product;
}