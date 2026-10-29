# Sujok Homeo Clinic — New Design: Developer Handoff

This guide is for the developer connecting the new design to the existing PHP (CodeIgniter) shop at sujokhomeoclinic.com. The new pages are plain HTML, CSS and JavaScript. The shop pages currently run on **sample data in the browser** so the design can be reviewed. The job is to replace that sample data with the existing system's real data and functions, while keeping the look and the page behaviour.

Preview: https://sujok-homeo-clinic-updated.vercel.app/

---

## 1. Approach

1. **Keep the existing back end.** That covers products, options, cart (server session), checkout, PayPal, orders, customer login and the Re-order Form.
2. **Turn the new pages into CodeIgniter views.** Header and footer become shared partials. The page content stays as is.
3. **Replace the browser-only parts** with calls to the server. That covers the product list in `shop-data.js`, the cart in `localStorage`, and the sample orders in `my-account.js`.
4. **Add small JSON endpoints where needed.** The current endpoints mostly return HTML built for the old table layout (for example `ctProduct` returns `<tr>` rows), which the new design can't use. The new JavaScript is easiest to connect to JSON.
5. **Work on a staging copy** with a full backup of files and database, and use the PayPal sandbox.

---

## 2. Files

| File | What it is | Developer action |
|---|---|---|
| `style-v3.css` | Global styles: header, footer, buttons, header search bar | Keep |
| `about-sujok.js`, `script-v3.js` | Header menu, dropdowns, mobile menu | Keep |
| `store-header.js` | Every page: cart count on the header icon, header search bar (sends to `shop.html?q=…`) | Change the count to come from the server cart (see section 4) |
| `shop.html` / `shop.css` / `shop.js` | Order Online: categories, A–Z, search, potency choice, cart drawer | Connect to the product and cart endpoints |
| `shop-data.js` | **Sample**: products copied from the live site on 2026-10-28 | Remove; load from the server instead |
| `checkout.html` / `.css` / `.js` | Cart → Order Delivery → Review and Pay | Connect cart, tax/shipping, coupon, order creation, PayPal |
| `order-confirmation.html` / `.js` | Order Confirmed (Status step) | Fill from the real order (replaces `Welcome/thankYou`) |
| `payment-failed.html` / `.js` | PayPal cancelled or declined | Use as the PayPal cancel URL |
| `order-status.css` | Styles for the two pages above | Keep |
| `account.html` / `.css` / `.js` | Sign in, Create account, Forgot password | Connect to login, registration and reset e-mail |
| `reset-password.html` / `.js` | Page the reset e-mail links to | Connect to a reset token |
| `my-account.html` / `.css` / `.js` | Orders + Reorder, Addresses, Account details, Change password | Replace the **sample** customer with real data |
| `reorder.html` / `.css` / `.js` | Re-order Form (1/2/3-month supply request) | Post to the existing `welcome/reorder_submit` |
| `emails/*.html` | Order confirmation, Ready for pickup, Shipped, Password reset | Use as e-mail templates (sample values shown) |

Search the JavaScript for `design preview` and `localStorage` to find every place that needs connecting.

---

## 3. Existing endpoints (from the live site's `js/custom.js`)

| Function | Endpoint | Notes |
|---|---|---|
| Products by category | `GET Welcome/ctProduct?catId=…` (+ `&q=b` … `z` for a letter) | Returns HTML rows. The new design needs JSON (see 4.1) |
| Search | `GET Welcome/srProduct?search=…&catId=…`, `GET searchMedicine?searchPhrase=…` | |
| Option price | `GET Welcome/optionPrice?optionId=…` | Not needed if prices come with the product JSON |
| Add/update cart | `POST Welcome/updateCart` `{optionId, productId, quantity}` | Returns JSON `{count, message, html}`. **Check whether quantity adds to or replaces the existing line** |
| Remove from cart | `POST Welcome/removeCart` `{productId, optionId}` | Returns JSON `{count, message}` |
| Cart contents | `POST Welcome/cartHtmls` | Returns HTML; the new design needs JSON (see 4.2) |
| Cities/provinces | `GET Welcome/coCities?countryId=…` | `countryId 7` = United States |
| Tax and shipping | `GET Welcome/provinceTaxShipping?provinceId=…` | `provinceId 11` = Ontario. The old page code then **overrides** shipping to $15 Ontario / $20 elsewhere; confirm which is correct |
| Coupon | `POST Welcome/coupAppl` | |
| Place order | `POST Welcome/loginOrderCreation` | Returns an order id, then `Welcome/thankYou?orderId=…` |
| Login | `welcome/login` | |
| Re-order Form | `POST welcome/reorder_submit` | Fields: `client_id, name, phone, email, medicine, comments` |

The live site also has a PHP notice printed inside an option label (Causticum, Drops 1M) from `views/elements/products.php` line 78 (`number_format` on a value that isn't a number).

---

## 4. Connecting each part

### 4.1 Products (`shop.js`)

`shop.js` reads `window.SHOP_DATA` in this shape:

```js
SHOP_DATA = {
  opts: [ [ ["Globules - 6c", 15], ["Drops - D3", 15], … ], … ],   // option sets: [label, price]
  cats: [ { id, name, intro, items: [ [name, abbreviation, optionSetIndex, details?], … ] }, … ]
}
```

Option labels drive the UI: `"Globules - 30c"` or `"Drops - 30c"` show a Globules/Drops toggle plus a Potency list. `"10 ml"` shows a Size list. A single `"Default"` option shows no choice.

**Needed:** an endpoint, for example `GET Welcome/shopJson`, that returns the same shape **plus the real IDs** (`productId` per item, `optionId` per option), so Add to Cart can send them. Loading it on the page as `window.SHOP_DATA` (server-rendered `<script>`) or by `fetch` both work. About 1,300 products load in well under a second.

### 4.2 Cart (`shop.js`, `checkout.js`, `store-header.js`, `payment-failed.js`)

The preview cart is an array in `localStorage['sh-cart']`:

```js
{ key, name, option, price, qty }
```

Replace it with the server session cart:
- **Add to Cart:** `POST updateCart {optionId, productId, quantity}`.
- **Quantity +/− and Remove** (cart drawer and checkout): `updateCart` / `removeCart`.
- **Show the cart:** a JSON version of `cartHtmls`, for example `GET Welcome/cartJson` → `{items:[{productId, optionId, name, option, price, qty}], count, subtotal}`.
- **Header cart count on every page** (`store-header.js`): read `count` from the same endpoint, or print it in the header from the server.

Keep the rules the design shows: **$20.00 minimum before taxes** (checkout button disabled under it), and a quantity of 1–99.

### 4.3 Checkout (`checkout.html`, `checkout.js`)

Steps: `checkout.html` (cart) → `#delivery` → `#payment`. The address bar hash keeps the browser Back button working. In the preview, typed details are kept in `sessionStorage` (this tab only); the server can take that over.

Delivery form field names (rename on either side to match `loginOrderCreation`):

| Field | Name | Notes |
|---|---|---|
| Order type | `order_type` | `Pickup` / `Delivery`. Pickup is disabled for US (same as the live site) |
| Preferred date | `date` | Today or later |
| Name, E-mail, Phone | `name`, `email`, `phone` | |
| Client ID | `client_id` | Optional in the design; **confirm if required** |
| Country | `country` | `CA` / `US`; map to `countryId` |
| Province / State | `province` / `state` | Province is a list; state is a text box for US. Map to `provinceId` |
| Street, City, Postal code | `street`, `city`, `postal` | Only shown and required for Delivery |
| Comments | `comments` | Optional |
| Terms | `terms` | Must be ticked |
| Buttons | `as` = `guest` / `user` | "Checkout as User" goes to `account.html` |

- **Tax and shipping in the summary:** call `provinceTaxShipping` when the province changes. Show the tax label and amount (the preview shows "By province, at payment"). Shipping is free for Pickup.
- **Coupon box:** `coupAppl`.
- **Review and Pay:** "Pay … with PayPal" creates the order (`loginOrderCreation`) and sends the customer to PayPal. Set the PayPal **return URL** to `order-confirmation.html?orderId=…` and the **cancel URL** to `payment-failed.html`.

### 4.4 Order Confirmed / Payment Not Completed

- `order-confirmation.js` reads an order object from `sessionStorage['co-order']`: `{no, placed, items, subtotal, ship, total, type, date, name, email, phone, address}`. Replace it with the real order by `orderId` (server-rendered or JSON). Remove the sample-order fallback.
- Empty the server cart once the order is paid.
- `payment-failed.html` lists the cart that is still saved. Keep the cart when payment fails.

### 4.5 Accounts (`account.html`, `reset-password.html`, `my-account.html`)

- **Sign in** → existing login. **Create account** → registration (first/last name, e-mail, phone, password: 8+ characters, a number, upper and lower case, plus the Terms tick).
- **Forgot password** → send `emails/password-reset.html` with a one-time link to `reset-password.html?token=…`. (New feature if the current site doesn't have it.)
- **My Account** (`my-account.js` uses a `SAMPLE` object):
  - **Orders:** number, date, status (`Ready for pickup`, `Shipped`, `Completed`), items, pickup or delivery, total.
  - **Reorder:** puts the order's items in the cart at **today's prices**, then opens checkout.
  - **Addresses:** add, edit, remove, set default (new if not in the current system).
  - **Account details** and **Change password**.
- Signed in, the header shows "Account" instead of "Login" (see `my-account.html`).

### 4.6 Re-order Form (`reorder.html`, `reorder.js`)

Post to `welcome/reorder_submit`. The design names the supply field `supply` with the values `1 Month Supply`, `2 Months Supply` and `3 Months Supply`. The existing form calls it `medicine`, so rename one side. In the design, Comments is optional (it's required on the live form); confirm with the clinic.

### 4.7 E-mails (`emails/`)

Built so they display correctly in e-mail apps: table layout with inline styles. Replace the sample values, and use **full https:// addresses** for the logo and links.
- **Order confirmation:** sent when an order is paid.
- **Ready for pickup** and **Shipped:** sent when staff change the order status. The Shipped e-mail has placeholders for the carrier and tracking number.
- **Password reset:** sent from Forgot password.

---

## 5. New in the design (may need back-end work)

- Header search across all products (`shop.html?q=…`)
- Order statuses shown to customers (Ready for pickup / Shipped / Completed), with e-mails
- Reorder from order history
- Saved addresses
- Forgot / reset password
- Payment Not Completed page with the cart kept

---

## 6. To confirm with the clinic

1. Shipping: $15 Ontario / $20 elsewhere, free pickup?
2. Tax rates by province
3. Is Client ID required at checkout?
4. Keep both the Re-order Form and My Account "Reorder"?
5. Wording of the e-mails and the "What happens next" steps
6. **Price errors in the database:**
   - Acidum Lacticum, Drops 30c: $1,215.00
   - Piper Nigrum, Drops 30c: $150.00
   - Causticum, Drops 1M: shows a PHP error
7. **A-Z Remedies description:** it lists 1x–6x and LM1–LM5. The options sold are 6c–CM and LM 1–LM 30.

## 7. Launch checklist

- **Staging:** full backup first; test with the PayPal sandbox.
- **Redirects:** send old URLs to the new pages, for example `/welcome/medicine` → `shop.html`, `/welcome/checkout` → `checkout.html`, `/welcome/login` → `account.html`, `/welcome/reorder_request` → `reorder.html`, `/aboutUs` → `about-sujok.html`, `/homeoPathy` → `homeopathy.html`, `/kidsHealth` → `kids-health.html`, `/painManagement` → `pain-management.html`, `/faq` → `faq.html`, `/termsConditions` → `terms.html`, `/privacyPolicy` → `privacy.html`.
- **Social links:** the footer social icons still need the clinic's links.
- **Final run-through:** test the full order flow on desktop and phone before switching the domain.
