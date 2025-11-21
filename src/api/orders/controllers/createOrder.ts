import { Request, Response } from 'express';
import OrdersModel from '@/models/orders.model';

export default function createOrder(req: Request, res: Response): void {
    OrdersModel.createOrder({
        user_id: req.user?.id,
        shipping_id: ,
        total:,
        status: ""
    })
}