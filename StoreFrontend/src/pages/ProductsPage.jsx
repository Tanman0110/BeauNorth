import { useEffect, useState } from "react";
import { getProducts } from "../api/productApi";
import ProductCard from "../components/ProductCard";
import "./ProductsPage.css";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await getProducts();
                setProducts(data.filter((product) => product.isActive));
            } catch (err) {
                setError(err.message || "Failed to load products.");
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, []);

    if (loading) {
        return <p className="products-status">Loading products...</p>;
    }

    if (error) {
        return <p className="products-status products-error">{error}</p>;
    }

    return (
        <main className="products-page">
            <section className="products-section">
                <h1 className="products-title">Products</h1>
                <p className="products-subtitle">Browse products from your API.</p>

                <div className="products-grid">
                    {products.map((product) => (
                        <ProductCard key={product.productId} product={product} />
                    ))}
                </div>
            </section>
        </main>
    );
}