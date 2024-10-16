import { Seller, Category } from "../models/seller_model";

export interface SellerRepository {
  extractFromExcel(): Seller[];
  updateDatabase(): Promise<Seller[]>;
  getSellersByCategory(categories: Category[]): Promise<
    {
      category: Category;
      numbers: { name: string; phone: string; contacted: string }[];
    }[]
  >;
  updateSellerContacted(date: string, id: string): Promise<void>;
  resetSellerContacted(date: string, phone: string): Promise<void>;
}
