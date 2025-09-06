import ProductModel from '@/models/product.model';
import responder from '@/services/responder.service';
import responses from '@/services/responses';
import { Request, Response } from 'express';

export default function getProducts(req: Request, res: Response) {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    // Implementation for fetching products
    ProductModel.getAllProducts(limit, offset).then((products) => {
        res.json({
            success: true,
            data: products
        });
    }).catch((error) => {
        console.error("Error fetching products:", error);
        responder(res, responses.Error.internalServerError, {
            message: "Failed to fetch products",
        });
    });
}