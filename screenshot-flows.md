# Complete Application Flow Screenshots

## Comprehensive Screenshot Capture Plan

### Authentication Flows
1. **home-page-logged-out** - Homepage before login
2. **home-page-logged-in** - Homepage after login
3. **login-flow** - Login button/process

### Main Navigation Flows
4. **catalog-page** - Product catalog with filters
5. **catalog-filters-active** - Catalog with active filters applied
6. **product-detail** - Individual product page
7. **cart-empty** - Empty shopping cart
8. **cart-with-items** - Cart with products added
9. **profile-page** - User profile with all sections
10. **about-page** - About us page

### E-commerce Flows
11. **add-to-cart** - Product being added to cart
12. **favorites-page** - User favorites/wishlist
13. **checkout-flow** - Order placement process
14. **order-confirmation** - Order completion page

### Admin Flows (if applicable)
15. **admin-dashboard** - Admin panel overview
16. **admin-products** - Product management
17. **admin-orders** - Order management

### Mobile Responsive Views
18. **mobile-home** - Homepage on mobile
19. **mobile-catalog** - Catalog on mobile
20. **mobile-cart** - Cart on mobile
21. **mobile-profile** - Profile on mobile
22. **mobile-navigation** - Mobile menu open

### Error/Edge Cases
23. **no-products-found** - Empty search results
24. **loading-states** - Loading skeletons
25. **error-pages** - 404 or error states

## Auto-Capture URLs
To capture these flows automatically, visit:

```
http://localhost:5000/?capture-flow=home-page-logged-out
http://localhost:5000/?capture-flow=home-page-logged-in
http://localhost:5000/catalog?capture-flow=catalog-page
http://localhost:5000/catalog?capture-flow=catalog-filters-active&category=cupcakes-doces&price=5-8
http://localhost:5000/product/[product-id]?capture-flow=product-detail
http://localhost:5000/cart?capture-flow=cart-empty
http://localhost:5000/cart?capture-flow=cart-with-items
http://localhost:5000/profile?capture-flow=profile-page
http://localhost:5000/about?capture-flow=about-page
http://localhost:5000/admin?capture-flow=admin-dashboard
```

## Manual Capture
Use the pink "📸 Capture" button in the top-right corner of each page to manually capture screenshots.