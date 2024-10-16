import { categories } from "./categories";
export type Category = (typeof categories)[number];
interface SellerModel {
  sellerId?: string;
  name: string;
  phone: number;
  zone: string;
  department: string;
  sellingCategory: string;
  farm: string;
  enterprise: string;
}

export class Seller implements SellerModel {
  name: string;
  phone: number;
  zone: string;
  department: string;
  sellingCategory: string;
  farm: string;
  enterprise: string;
  sellerId?: string;

  constructor(
    name: string,
    phone: number,
    zone: string,
    department: string,
    sellingCategory: string,
    farm: string,
    enterprise: string,
    sellerId?: string
  ) {
    this.sellerId = sellerId;
    this.name = name;
    this.phone = phone;
    this.zone = zone;
    this.department = department;
    this.sellingCategory = sellingCategory;
    this.farm = farm;
    this.enterprise = enterprise;
  }
  static fromData(data: any): Seller {
    const categories: string = `{${data["Categoria de venta"]
      .split(";")
      .map((categoria: string) => {
        const categoriasIgnoradas: string[] = ["vaca", "burlanda"];
        if (!categoriasIgnoradas.includes(categoria.toLowerCase())) {
          return categoria.toLowerCase();
        } else {
          return undefined;
        }
      })
      .filter(Boolean)
      .join(",")}}`;
    return {
      sellerId: `${data.Nombre.replace(/\s/g, "")}${data.Telefono}`,
      name: data.Nombre,
      phone: data.Telefono,
      zone: data.Zona,
      department: data.Departamento,
      sellingCategory: categories,
      farm: data.Estancia,
      enterprise: data.Empresa,
    };
  }
  static toArray(seller: Seller): string[] {
    return Object.values(seller).map((property) => property);
  }
}
