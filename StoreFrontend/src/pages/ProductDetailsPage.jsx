import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProductById } from "../api/productApi";
import "./ProductDetailsPage.css";

export default function ProductDetailsPage() {
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadProduct() {
            try {
                const data = await getProductById(id);
                setProduct(data);

                const sizes = data.sizeOptions
                    ? data.sizeOptions.split(",").map((size) => size.trim())
                    : [];

                const colors = data.colorOptions
                    ? data.colorOptions.split(",").map((color) => color.trim())
                    : [];

                if (sizes.length > 0) {
                    setSelectedSize(sizes[0]);
                }

                if (colors.length > 0) {
                    setSelectedColor(colors[0]);
                }
            } catch (err) {
                setError(err.message || "Failed to load product.");
            } finally {
                setLoading(false);
            }
        }

        loadProduct();
    }, [id]);

    function handleAddToCart() {
        if (!product) return;

        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        const existingItemIndex = cart.findIndex(
            (item) =>
                item.productId === product.productId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor
        );

        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({
                productId: product.productId,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity,
                selectedSize,
                selectedColor
            });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("storage"));
        setMessage("Added to cart.");
    }

    if (loading) {
        return <p className="product-details-status">Loading product...</p>;
    }

    if (error) {
        return <p className="product-details-status product-details-error">{error}</p>;
    }

    if (!product) {
        return <p className="product-details-status">Product not found.</p>;
    }

    const sizes = product.sizeOptions
        ? product.sizeOptions.split(",").map((size) => size.trim())
        : [];

    const colors = product.colorOptions
        ? product.colorOptions.split(",").map((color) => color.trim())
        : [];

    return (
        <main className="product-details-page">
            <section className="product-details-section">
                <Link to="/products" className="product-details-back">
                    ← Back to Products
                </Link>

                <div className="product-details-card">
                    <div>
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="product-details-image"
                        />
                    </div>

                    <div>
                        <p className="product-details-category">
                            {product.category?.name || "Uncategorized"}
                        </p>

                        <h1 className="product-details-title">{product.name}</h1>

                        <p className="product-details-price">
                            ${Number(product.price).toFixed(2)}
                        </p>

                        <p className="product-details-description">
                            {product.description}
                        </p>

                        {sizes.length > 0 && (
                            <div className="product-details-field">
                                <label className="product-details-label">Size</label>
                                <select
                                    className="product-details-select"
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                >
                                    {sizes.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {colors.length > 0 && (
                            <div className="product-details-field">
                                <label className="product-details-label">Color</label>
                                <select
                                    className="product-details-select"
                                    value={selectedColor}
                                    onChange={(e) => setSelectedColor(e.target.value)}
                                >
                                    {colors.map((color) => (
                                        <option key={color} value={color}>
                                            {color}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="product-details-field">
                            <label className="product-details-label">Quantity</label>
                            <input
                                className="product-details-input"
                                type="number"
                                min="1"
                                max={product.stockQuantity}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>

                        <p className="product-details-stock">
                            In Stock: {product.stockQuantity}
                        </p>

                        <button
                            className="product-details-button"
                            onClick={handleAddToCart}
                        >
                            Add to Cart
                        </button>

                        {message && (
                            <p className="product-details-message">{message}</p>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}