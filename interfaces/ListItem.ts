import { Product } from "./Product";

export interface ListItem {
    id?: string;
    product: Product;
    quantity: number;
    comment?: string;
}