import ProductModel from "@/models/product.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";
import { Request, Response } from "express";

export default function deleteProduct(req: Request, res: Response) {
    const productId = parseInt(req.body.id);

    ProductModel.deleteProduct(productId).then(() => {
        responder(res, responses.api.products.deleted)
    }).catch((error) => {
        console.error("Error deleting product:", error);
        responder(res, responses.Error.internalServerError, {
            message: "Failed to delete product",
        });
    });
}
