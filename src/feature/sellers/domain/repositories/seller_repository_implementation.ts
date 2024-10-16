import { ExcelDatabaseSource } from "../../data/excel_data_source";
import { SellersPostgresDatasource } from "../../data/psql_data_source";
import { Category, Seller } from "../models/seller_model";
import { SellerRepository } from "./seller_repository";

export class SellerRepositoryImplementation implements SellerRepository {
  static instance: SellerRepository | null = null;
  private sellersPgDatasource: SellersPostgresDatasource;
  constructor(sellersPgDs: SellersPostgresDatasource) {
    this.sellersPgDatasource = sellersPgDs;
  }
  static create(sellersPgDs: SellersPostgresDatasource) {
    if (SellerRepositoryImplementation.instance == null) {
      SellerRepositoryImplementation.instance =
        new SellerRepositoryImplementation(sellersPgDs);
    }
    return SellerRepositoryImplementation.instance;
  }
  extractFromExcel(): Seller[] {
    return ExcelDatabaseSource.extractData();
  }
  async updateDatabase(): Promise<Seller[]> {
    const dataToInsert = this.extractFromExcel();
    const dataArray = dataToInsert.map((data) => {
      return Seller.toArray(data);
    });
    const insertedData = await this.sellersPgDatasource.updateSellers(
      dataArray
    );
    return insertedData;
  }
  getSellersByCategory(categories: Category[]): Promise<
    {
      category: Category;
      numbers: { name: string; phone: string; contacted: string }[];
    }[]
  > {
    try {
      return this.sellersPgDatasource.getSellersByCategory(categories);
    } catch (err: any) {
      throw err;
    }
  }

  updateSellerContacted(date: string, id: string): Promise<void> {
    try {
      return this.sellersPgDatasource.updateSellersContacted(date, id);
    } catch (e: any) {
      throw new Error(`Error updating contacted: ${e}`);
    }
  }
  resetSellerContacted(date: string, phone: string): Promise<void> {
    try {
      return this.sellersPgDatasource.resetSellersContacted(date, phone);
    } catch (e: any) {
      throw new Error(`Error updating contacted: ${e}`);
    }
  }
}
