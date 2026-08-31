"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  useProducts,
  useProductSearch,
} from "@/features/products/productQueries";
import { itemAddedToCart } from "@/features/cart/cartSlice";
import { CartPanel } from "@/features/cart/CartPanel";
import { useSelector } from "react-redux";
import { cartSelectors } from "@/features/cart/cartSlice";


function ProductCard({ product }) {
  const dispatch = useDispatch();

  const productId = product._id || product.id;

  function handleAddToCart() {
    dispatch(
      itemAddedToCart({
        productId,
        productName: product.name,
        unitPrice: product.price,
        imageUrl: product.imageUrl,
      })
    );
  }

  return (
    <article className="product-card">
      {product.imageUrl ? (
        <img
          src={`http://localhost:8080${product.imageUrl}`}
          alt={product.name}
          className="product-image"
        />
      ) : (
        <div className="product-image placeholder">No image</div>
      )}

      <div className="product-content">
        <p className="category">{product.category}</p>
        <h2>{product.name}</h2>
        <p className="description">{product.description}</p>
        <div className="product-footer">
          <strong>${Number(product.price).toFixed(2)}</strong>
          <span className={`stock-label ${product.stock === 0 ? "out-of-stock" : ""}`}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
          <button type="button" onClick={handleAddToCart} disabled={product.stock === 0}>
            {product.stock > 0 ? "Add" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const normalizedSearch = searchTerm.trim();

  const productsQuery = useProducts();
  const searchQuery = useProductSearch(normalizedSearch);

  const isSearching = normalizedSearch.length > 0;
  const activeQuery = isSearching ? searchQuery : productsQuery;

  const products = activeQuery.data?.products || [];
  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean))
  );

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);
  const cartItems = useSelector(cartSelectors.selectAll);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <main className="page-shell">
      <section className="top-bar">
        <div>
          <h1>OrderFlow Lite</h1>
          <p>Product catalog backed by MongoDB, Redis, and Elasticsearch.</p>
        </div>

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search products"
          className="search-input"
        />
        <div className="cart-count">
          Cart: <strong>{cartCount}</strong>
        </div>
      </section>

      <div className="category-filter">
        <button
          type="button"
          className={selectedCategory === "all" ? "active" : ""}
          onClick={() => setSelectedCategory("all")}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={selectedCategory === category ? "active" : ""}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {activeQuery.isLoading && <p>Loading products...</p>}

      {activeQuery.isError && (
        <p className="error-message">
          {activeQuery.error.message || "Failed to load products"}
        </p>
      )}

      <section className="content-layout">
        <div>
          <section className="product-grid">
            {filteredProducts.map((product) => {
              const productId = product._id || product.id;

              return <ProductCard key={productId} product={product} />;
            })}
          </section>
        </div>

        <CartPanel />
      </section>
    </main>
  );
}
