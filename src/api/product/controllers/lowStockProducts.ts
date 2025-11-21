import ProductModel from "@/models/product.model";
import { Request, Response } from "express";

export default function lowStockProducts(req: Request, res: Response) {
  const threshold = parseInt(req.query.threshold as string) || 5;

  ProductModel.getLowStockProducts(threshold).then((products) => {
    res.json({ products });
  });
}
