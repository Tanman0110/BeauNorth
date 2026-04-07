import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../api/categoryApi";
import "./CategoriesPage.css";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCategories() {
            try {
                const data = await getCategories();
                setCategories(data.filter((category) => category.isActive));
            } catch (err) {
                setError(err.message || "Failed to load categories.");
            } finally {
                setLoading(false);
            }
        }

        loadCategories();
    }, []);

    if (loading) {
        return <p className="categories-status">Loading categories...</p>;
    }

    if (error) {
        return <p className="categories-status categories-error">{error}</p>;
    }

    return (
        <main className="categories-page">
            <section className="categories-section">
                <h1 className="categories-title">All Categories</h1>
                <p className="categories-subtitle">
                    Browse Beau North by category.
                </p>

                <div className="categories-grid">
                    {categories.map((category) => (
                        <Link
                            key={category.categoryId}
                            to={`/categories/${category.categoryId}`}
                            className="category-card"
                        >
                            <h2 className="category-card-title">{category.name}</h2>
                            <p className="category-card-description">
                                {category.description || "View products in this category."}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}