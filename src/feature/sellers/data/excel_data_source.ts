import { Seller } from "../domain/models/seller_model";
const xlsx = require("xlsx");

export class ExcelDatabaseSource {
  static extractData(): Seller[] {
    const workbook = xlsx.readFile(
      "./src/feature/sellers/data/excel/base_de_datos_consignataria.xlsx"
    );
    let workbook_sheet = workbook.SheetNames;
    let workbook_data = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook_sheet[0]]
    );
    const dbData = workbook_data.map((data: any) => Seller.fromData(data));
    return dbData;
  }
}
