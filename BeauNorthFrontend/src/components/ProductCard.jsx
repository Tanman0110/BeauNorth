import { Link } from "react-router-dom";
import { getPrimaryProductImage } from "../utils/productImages";
import "./ProductCard.css";

export default function ProductCard({ product }) {
    const imageUrl = getPrimaryProductImage(product);
    const description =
        product.shortDescription ||
        product.description ||
        "";

    return (
        <Link
            to={`/products/${product.productId}`}
            className="product-card"
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="product-card-image"
                />
            ) : (
                <div className="product-card-image product-card-image-placeholder">
                    No Image
                </div>
            )}

            <div className="product-card-body">
                <p className="product-card-category">
                    {product.category?.name || "Uncategorized"}
                </p>

                <h2 className="product-card-title">{product.name}</h2>

                <p className="product-card-description">
                    {description}
                </p>

                <p className="product-card-price">
                    ${Number(product.price).toFixed(2)}
                </p>
            </div>
        </Link>
    );
}