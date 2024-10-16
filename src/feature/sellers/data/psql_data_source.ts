import { QueryResult } from "pg";
import pool from "../../../core/services/postgres-service";
import { Seller, Category } from "../domain/models/seller_model";
import {
  UPDATE_DATABASE,
  GET_SELLER_NUMBER_BY_CATEGORY,
  UPDATE_SELLER_CONTACTED,
} from "./queries/queries";
import { query } from "express";
import { RESET_LAST_CONTACTED } from "./queries/queries";
const format = require("pg-format");

export class SellersPostgresDatasource {
  async updateSellers(data: string[][]) {
    return await this.callDatabase({
      query: format(UPDATE_DATABASE, data) as string,
      callback: (result) => result.rows,
    });
  }

  async getSellersByCategory(categories: Category[]) {
    let numbersByCategory = [];
    for (let category of categories) {
      const results = await this.callDatabase({
        query: GET_SELLER_NUMBER_BY_CATEGORY,
        values: [category],
        callback: (numbers) => numbers.rows,
      });
      numbersByCategory.push({
        category: category,
        numbers: results,
      });
    }
    return numbersByCategory;
  }
  async updateSellersContacted(date: string, id: string) {
    await this.callDatabase({
      query: UPDATE_SELLER_CONTACTED,
      values: [date, id],
      callback: () => null,
    });
  }
  async resetSellersContacted(date: string, phone: string) {
    await this.callDatabase({
      query: RESET_LAST_CONTACTED,
      values: [date, phone],
      callback: () => null,
    });
  }
  private async callDatabase<T>({
    query,
    callback,
    values,
  }: {
    query: string;
    callback: (result: QueryResult<any>) => T;
    values?: any[];
  }): Promise<T> {
    try {
      const response = await pool.query(query, values);
      return callback(response);
    } catch (e: any) {
      throw new Error(`Database error: ${e}`);
    }
  }
}
