import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getCategoryById } from "../api/categoryApi";
import { getProducts } from "../api/productApi";
import ProductCard from "../components/ProductCard";
import { groupProductsForDisplay } from "../utils/productGrouping";
import "./CategoryPage.css";

export default function CategoryPage() {
    const { id } = useParams();

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCategoryPage() {
            try {
                const [categoryData, productsData] = await Promise.all([
                    getCategoryById(id),
                    getProducts()
                ]);

                setCategory(categoryData);
                setProducts(
                    groupProductsForDisplay(
                        productsData.filter((product) => product.isActive)
                    )
                );
            } catch (err) {
                setError(err.message || "Failed to load category.");
            } finally {
                setLoading(false);
            }
        }

        loadCategoryPage();
    }, [id]);

    const filteredProducts = useMemo(() => {
        return products.filter(
            (product) => Number(product.categoryId) === Number(id)
        );
    }, [products, id]);

    if (loading) {
        return <p className="category-page-status loading-screen-space">Loading category...</p>;
    }

    if (error) {
        return <p className="category-page-status category-page-error">{error}</p>;
    }

    if (!category) {
        return <p className="category-page-status">Category not found.</p>;
    }

    return (
        <main className="category-page">
            <section className="category-section">
                <h1 className="category-title">{category.name}</h1>
                <p className="category-subtitle">
                    {category.description || "Browse all products in this category."}
                </p>

                <div className="category-products-grid">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.productId} product={product} />
                    ))}
                </div>
            </section>
        </main>
    );
}