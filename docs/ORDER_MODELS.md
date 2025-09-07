# Order System CRUD Models

This directory contains the complete CRUD (Create, Read, Update, Delete) models for the order management system, including orders, order items, payments, and shipping.

## Overview

The order system consists of four main entities:

1. **Orders** (`orders.model.ts`) - Main order records
2. **Order Items** (`orderItems.model.ts`) - Items within each order
3. **Payments** (`payments.model.ts`) - Payment information for orders
4. **Shipping** (`shipping.model.ts`) - Shipping and delivery information

## Database Schema

### Orders Table

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    shipping_id INT NOT NULL REFERENCES shipping(id),
    total DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Order Items Table

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    UNIQUE(order_id, product_id)
);
```

### Payments Table

```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    stripe_payment_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'egp',
    status payment_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    payment_method payment_method_type DEFAULT 'cash',
    CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Shipping Table

```sql
CREATE TABLE shipping (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    tracking_number TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    status shipping_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Models Usage

### OrdersModel

#### Basic Operations

```typescript
import OrdersModel from "./models/orders.model";

// Create a new order
const order = await OrdersModel.createOrder({
  user_id: 1,
  shipping_id: 1,
  total: 99.99,
  status: "pending",
});

// Find order by ID
const order = await OrdersModel.findOrderById(1);

// Find orders by user ID
const userOrders = await OrdersModel.findOrdersByUserId(1);

// Update order
const updatedOrder = await OrdersModel.updateOrder(1, { status: "completed" });

// Update order status
const updatedOrder = await OrdersModel.updateOrderStatus(1, "completed");

// Get order with details (includes shipping and user info)
const orderDetails = await OrdersModel.getOrderWithDetails(1);

// Delete order
await OrdersModel.deleteOrder(1);
```

### OrderItemsModel

#### Basic Operations

```typescript
import OrderItemsModel from "./models/orderItems.model";

// Create single order item
const orderItem = await OrderItemsModel.createOrderItem({
  order_id: 1,
  product_id: 1,
  quantity: 2,
});

// Create multiple order items
const orderItems = await OrderItemsModel.createMultipleOrderItems([
  { order_id: 1, product_id: 1, quantity: 2 },
  { order_id: 1, product_id: 3, quantity: 1 },
]);

// Find order items by order ID
const orderItems = await OrderItemsModel.findOrderItemsByOrderId(1);

// Get order items with product details
const itemsWithDetails =
  await OrderItemsModel.getOrderItemsWithProductDetails(1);

// Update order item
const updatedItem = await OrderItemsModel.updateOrderItem(1, { quantity: 3 });

// Update quantity
const updatedItem = await OrderItemsModel.updateOrderItemQuantity(1, 5);

// Delete order item
await OrderItemsModel.deleteOrderItem(1);

// Delete all items for an order
await OrderItemsModel.deleteOrderItemsByOrderId(1);
```

### PaymentsModel

#### Basic Operations

```typescript
import PaymentsModel from "./models/payments.model";

// Create payment
const payment = await PaymentsModel.createPayment({
  order_id: 1,
  user_id: 1,
  amount: "99.99",
  currency: "egp",
  status: "pending",
  payment_method: "cash",
});

// Find payment by order ID
const payment = await PaymentsModel.findPaymentByOrderId(1);

// Find payments by user ID
const userPayments = await PaymentsModel.findPaymentsByUserId(1);

// Find payment by Stripe ID
const payment = await PaymentsModel.findPaymentByStripeId("pi_1234567890");

// Update payment status
const updatedPayment = await PaymentsModel.updatePaymentStatus(1, "completed");

// Get payments by status
const pendingPayments = await PaymentsModel.getPaymentsByStatus("pending");

// Get payments by method
const cashPayments = await PaymentsModel.getPaymentsByMethod("cash");
```

### ShippingModel

#### Basic Operations

```typescript
import ShippingModel from "./models/shipping.model";

// Create shipping record
const shipping = await ShippingModel.createShipping({
  user_id: 1,
  address: "123 Main Street",
  city: "Cairo",
  state: "Cairo",
  postal_code: "12345",
  country: "Egypt",
  shipping_status: "pending",
});

// Find shipping by ID
const shipping = await ShippingModel.findShippingById(1);

// Find shipping by user ID
const userShipping = await ShippingModel.findShippingByUserId(1);

// Find shipping by tracking number
const shipping = await ShippingModel.findShippingByTrackingNumber("TRACK123");

// Update shipping status
const updatedShipping = await ShippingModel.updateShippingStatus(1, "shipped");

// Update tracking number
const updatedShipping = await ShippingModel.updateTrackingNumber(1, "TRACK456");

// Get shipping with user details
const shippingDetails = await ShippingModel.getShippingWithUserDetails(1);
```

## Order Service

The `OrderService` provides high-level operations that work with multiple models:

```typescript
import OrderService from "./services/order.service";

// Create complete order with all related entities
const completeOrder = await OrderService.createCompleteOrder({
  userId: 1,
  shippingAddress: {
    user_id: 1,
    address: "123 Main Street",
    city: "Cairo",
    state: "Cairo",
    postal_code: "12345",
    country: "Egypt",
    shipping_status: "pending",
  },
  orderItems: [
    { product_id: 1, quantity: 2 },
    { product_id: 3, quantity: 1 },
  ],
  payment: {
    user_id: 1,
    amount: "150.00",
    currency: "egp",
    status: "pending",
    payment_method: "cash",
  },
  total: 150.0,
});

// Get complete order information
const orderInfo = await OrderService.getCompleteOrderById(1);

// Get all orders for a user
const userOrders = await OrderService.getUserOrders(1);

// Update order status and related entities
const updatedOrder = await OrderService.updateOrderStatus(
  1,
  "completed",
  "completed",
  "delivered",
);

// Cancel order
const cancelled = await OrderService.cancelOrder(1);

// Get order statistics
const stats = await OrderService.getOrderStatistics();
```

## Enums and Types

The system uses the following enums defined in SQL:

```sql
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE shipping_status AS ENUM ('pending', 'shipped', 'delivered', 'returned');
CREATE TYPE payment_method_type AS ENUM ('cash', 'paymob');
```

## Error Handling

All models include comprehensive error handling and will throw descriptive errors:

```typescript
try {
  const order = await OrdersModel.createOrder(orderData);
} catch (error) {
  console.error("Error creating order:", error.message);
}
```

## Examples

See `examples/orderExamples.ts` for comprehensive usage examples of all models and operations.

## Features

### Orders

- ✅ CRUD operations
- ✅ Find by user ID
- ✅ Status updates
- ✅ Join with shipping and user data
- ✅ Soft delete support

### Order Items

- ✅ CRUD operations
- ✅ Bulk creation
- ✅ Find by order ID
- ✅ Join with product data
- ✅ Quantity updates
- ✅ Unique constraint handling

### Payments

- ✅ CRUD operations
- ✅ Stripe integration support
- ✅ Multiple payment methods
- ✅ Status tracking
- ✅ Currency support
- ✅ Find by various criteria

### Shipping

- ✅ CRUD operations
- ✅ Tracking number management
- ✅ Status updates
- ✅ Address management
- ✅ Join with user data

## Best Practices

1. **Always use transactions** for operations that affect multiple tables
2. **Validate data** before calling model methods
3. **Handle errors** appropriately in your application
4. **Use the OrderService** for complex operations involving multiple entities
5. **Check for null results** when finding records by ID
6. **Use appropriate types** from the entity interfaces

## Testing

Each model should be tested with unit tests covering:

- CRUD operations
- Error scenarios
- Data validation
- Join queries
- Edge cases

This implementation provides a complete, type-safe, and robust foundation for managing orders in your e-commerce backend.
