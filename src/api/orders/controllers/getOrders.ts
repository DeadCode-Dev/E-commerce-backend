import OrdersModel from "@/models/orders.model";
import { Request, Response } from "express";

export default function getOrders(req: Request, res: Response) {
    OrdersModel.getAllOrders(Number(req.query.offset) || 0, Number(req.query.limit) || 10).then((orders) => {
        res.status(200).json(orders);
    }).catch((error) => {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    });
}