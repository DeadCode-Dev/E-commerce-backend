import { Request, Response } from 'express';
import OrdersModel from '@/models/orders.model';
import ShippingModel from '@/models/shipping.model';

export default async function createOrder(req: Request, res: Response): Promise<void> {
    const { address, city, postal_code, country, total } = req.body;
    const shipping = await ShippingModel.createShipping({
        user_id: req.user?.id,
        tracking_number: `TRACK${Date.now()}`,
        address,
        city,
        state: req.body.state,
        postal_code,
        country,
        shipping_status: 'pending'
    })
    await OrdersModel.createOrder({
        user_id: req.user?.id,
        shipping_id: shipping.id,
        total,
        status: "pending",
    })
}