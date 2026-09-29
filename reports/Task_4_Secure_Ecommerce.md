# Task 4 - Secure E-Commerce Checkout

Northstar is a small storefront with four products, account login, a database-backed cart, and two ways to complete a test purchase. It can create a Stripe Checkout Session when test credentials are available, or use the included local sandbox for an offline review.

## Checkout design

The browser sends product references and quantities, but it does not decide the amount to charge. The server reloads the current price and stock from SQLite, creates a pending order, and stores an order-item snapshot. With Stripe enabled, stock changes only after a signed `checkout.session.completed` webhook. Processed event IDs are recorded so the same event cannot complete an order twice.

The local sandbox calls the same completion routine. Inventory reduction, the paid status, and cart clearing happen inside one SQLite transaction; if any item is short on stock, the whole change rolls back.

## What is included

- Responsive product grid and cart drawer.
- Quantity controls that respect available stock.
- Password hashing and JWT-protected cart endpoints.
- Stripe test-mode Checkout Sessions support.
- Local checkout sandbox for reviewers without external credentials.
- Atomic stock updates and duplicate-event protection.

## What I tested

An integration test adds two products, completes a sandbox checkout, reads the paid order, and checks the exact inventory decrease. In the browser I verified sign-in persistence, the cart subtotal, quantity changes, and the checkout response. The production dependency audit reports no known vulnerabilities.

The key design choice was to treat the provider event—not the success page—as proof of payment. A customer can refresh or revisit a browser page; that should never be enough to change inventory.
