import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api/productApi";
import ProductCard from "../components/ProductCard";
import "./ProductsPage.css";

export default function ProductsPage() {
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get("search") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [maxPrice, setMaxPrice] = useState("");

    useEffect(() => {
        setSearchTerm(initialSearch);
    }, [initialSearch]);

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

    const categories = useMemo(() => {
        const categoryNames = products
            .map((product) => product.category?.name)
            .filter(Boolean);

        return ["All", ...new Set(categoryNames)];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.description || "").toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory =
                selectedCategory === "All" || product.category?.name === selectedCategory;

            const matchesPrice =
                !maxPrice || Number(product.price) <= Number(maxPrice);

            return matchesSearch && matchesCategory && matchesPrice;
        });
    }, [products, searchTerm, selectedCategory, maxPrice]);

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
                <p className="products-subtitle">Browse Beau North products.</p>

                <div className="products-filters">
                    <input
                        className="products-filter-input"
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <select
                        className="products-filter-input"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <input
                        className="products-filter-input"
                        type="number"
                        min="0"
                        placeholder="Max price"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />
                </div>

                <div className="products-grid">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.productId} product={product} />
                    ))}
                </div>
            </section>
        </main>
    );
}