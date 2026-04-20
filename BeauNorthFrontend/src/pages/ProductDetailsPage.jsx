import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getProductById, getProducts } from "../api/productApi";
import { addItemToCart } from "../api/cartApi";
import { useAuth } from "../context/useAuth";
import {
    getAvailableImageColors,
    getImagesForColor,
    getPrimaryProductImage
} from "../utils/productImages";
import {
    findGroupedSiblings,
    findVariantForSelection,
    normalizeOptionValue
} from "../utils/productGrouping";
import "./ProductDetailsPage.css";

export default function ProductDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [product, setProduct] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedImageUrl, setSelectedImageUrl] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadProduct() {
            try {
                const [productData, productsData] = await Promise.all([
                    getProductById(id),
                    getProducts()
                ]);

                setProduct(productData);
                setAllProducts(productsData.filter((item) => item.isActive));
            } catch (err) {
                setError(err.message || "Failed to load product.");
            } finally {
                setLoading(false);
            }
        }

        loadProduct();
    }, [id]);

    const siblingVariants = useMemo(() => {
        if (!product) return [];
        return findGroupedSiblings(allProducts, product);
    }, [allProducts, product]);

    const colors = useMemo(() => {
        const fromVariants = [
            ...new Set(
                siblingVariants
                    .map((variant) => normalizeOptionValue(variant.colorOptions))
                    .filter(Boolean)
            )
        ];

        const fromImages = getAvailableImageColors(product);
        return fromVariants.length > 0 ? fromVariants : fromImages;
    }, [siblingVariants, product]);

    const sizes = useMemo(() => {
        return [
            ...new Set(
                siblingVariants
                    .map((variant) => normalizeOptionValue(variant.sizeOptions))
                    .filter(Boolean)
            )
        ];
    }, [siblingVariants]);

    useEffect(() => {
        if (!product) return;

        const initialColor = normalizeOptionValue(product.colorOptions) || colors[0] || "";
        const initialSize = normalizeOptionValue(product.sizeOptions) || sizes[0] || "";

        setSelectedColor(initialColor);
        setSelectedSize(initialSize);
    }, [product, colors, sizes]);

    const activeVariant = useMemo(() => {
        if (siblingVariants.length === 0) return product;
        return findVariantForSelection(siblingVariants, selectedColor, selectedSize);
    }, [siblingVariants, selectedColor, selectedSize, product]);

    useEffect(() => {
        if (!activeVariant) return;
        setSelectedImageUrl(getPrimaryProductImage(activeVariant, selectedColor));
        setQuantity(1);
    }, [activeVariant, selectedColor]);

    const visibleImages = useMemo(() => {
        if (!activeVariant) return [];
        const byColor = getImagesForColor(activeVariant, selectedColor);
        return byColor.length > 0 ? byColor : (activeVariant.productImages || []);
    }, [activeVariant, selectedColor]);

    function handleQuantityChange(event) {
        if (!activeVariant) return;

        let value = event.target.value.replace(/^0+/, "");

        if (value === "") {
            setQuantity(1);
            return;
        }

        let numericValue = Number(value);

        if (Number.isNaN(numericValue) || numericValue < 1) {
            numericValue = 1;
        }

        if (numericValue > activeVariant.stockQuantity) {
            numericValue = activeVariant.stockQuantity;
        }

        setQuantity(numericValue);
    }

    async function handleAddToCart() {
        if (!activeVariant) return;

        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        try {
            await addItemToCart({
                productId: activeVariant.productId,
                quantity,
                sizeSelected: selectedSize || null,
                colorSelected: selectedColor || null
            });

            window.dispatchEvent(new Event("cart-updated"));
            setMessage("Added to cart.");
            setError("");
        } catch (err) {
            setError(err.message || "Failed to add item to cart.");
        }
    }

    if (loading) {
        return <p className="product-details-status loading-screen-space">Loading product...</p>;
    }

    if (error && !product) {
        return <p className="product-details-status product-details-error">{error}</p>;
    }

    if (!product || !activeVariant) {
        return <p className="product-details-status">Product not found.</p>;
    }

    return (
        <main className="product-details-page">
            <section className="product-details-section">
                <Link to="/products" className="product-details-back">
                    ← Back to Products
                </Link>

                <div className="product-details-card">
                    <div className="product-details-media-column">
                        <div className="product-details-image-frame">
                            {selectedImageUrl ? (
                                <img
                                    src={selectedImageUrl}
                                    alt={product.name}
                                    className="product-details-image"
                                />
                            ) : (
                                <div className="product-details-image product-details-image-placeholder">
                                    No Image
                                </div>
                            )}
                        </div>

                        {visibleImages.length > 1 && (
                            <div className="product-details-thumbnails">
                                {visibleImages.map((image) => (
                                    <button
                                        key={`${image.colorName}-${image.imageUrl}`}
                                        type="button"
                                        className={`product-details-thumbnail-button ${selectedImageUrl === image.imageUrl ? "active" : ""}`}
                                        onClick={() => setSelectedImageUrl(image.imageUrl)}
                                    >
                                        <img
                                            src={image.imageUrl}
                                            alt={`${product.name} ${image.colorName || ""}`}
                                            className="product-details-thumbnail-image"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="product-details-category">
                            {product.category?.name || "Uncategorized"}
                        </p>

                        <h1 className="product-details-title">{product.name}</h1>

                        <p className="product-details-price">
                            ${Number(product.price).toFixed(2)}
                        </p>

                        {(product.shortDescription || product.description) && (
                            <p className="product-details-description">
                                {product.shortDescription || product.description}
                            </p>
                        )}

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
                                max={activeVariant.stockQuantity}
                                value={quantity}
                                onChange={handleQuantityChange}
                            />
                        </div>

                        <p className="product-details-stock">
                            In Stock: {activeVariant.stockQuantity}
                        </p>

                        <button
                            className="product-details-button"
                            onClick={handleAddToCart}
                        >
                            Add to Cart
                        </button>

                        {message && <p className="product-details-message">{message}</p>}
                        {error && product && <p className="product-details-error">{error}</p>}

                        {product.longDescriptionHtml && (
                            <div
                                className="product-long-description prose-content"
                                dangerouslySetInnerHTML={{ __html: product.longDescriptionHtml }}
                            />
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}