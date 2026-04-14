import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../api/categoryApi";
import { getProducts } from "../api/productApi";
import "./CategoriesPage.css";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [categoryImages, setCategoryImages] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const [categoryData, productData] = await Promise.all([
                    getCategories(),
                    getProducts(),
                ]);

                const activeCategories = categoryData.filter((category) => category.isActive);
                const activeProducts = productData.filter((product) => product.isActive);

                const imageMap = {};

                activeCategories.forEach((category) => {
                    const productsInCategory = activeProducts.filter(
                        (product) =>
                            product.categoryId === category.categoryId &&
                            product.imageUrl &&
                            product.imageUrl.trim() !== ""
                    );

                    if (productsInCategory.length > 0) {
                        const randomIndex = Math.floor(Math.random() * productsInCategory.length);
                        imageMap[category.categoryId] = productsInCategory[randomIndex].imageUrl;
                    }
                });

                setCategories(activeCategories);
                setCategoryImages(imageMap);
            } catch (err) {
                setError(err.message || "Failed to load categories.");
            } finally {
                setLoading(false);
            }
        }

        loadData();
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
                            <div className="category-card-image-wrapper">
                                {categoryImages[category.categoryId] ? (
                                    <img
                                        src={categoryImages[category.categoryId]}
                                        alt={category.name}
                                        className="category-card-image"
                                    />
                                ) : (
                                    <div className="category-card-image-placeholder">
                                        No image available
                                    </div>
                                )}
                            </div>

                            <div className="category-card-body">
                                <h2 className="category-card-title">{category.name}</h2>

                                <p className="category-card-description">
                                    {category.description || "View products in this category."}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}