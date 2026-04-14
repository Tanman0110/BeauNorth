import { Link } from "react-router-dom";
import "./ProductCard.css";

export default function ProductCard({ product }) {
    return (
        <Link
            to={`/products/${product.productId}`}
            className="product-card"
        >
            <img
                src={product.imageUrl}
                alt={product.name}
                className="product-card-image"
            />

            <div className="product-card-body">
                <p className="product-card-category">
                    {product.category?.name || "Uncategorized"}
                </p>

                <h2 className="product-card-title">{product.name}</h2>

                <p className="product-card-description">
                    {product.description}
                </p>

                <p className="product-card-price">
                    ${Number(product.price).toFixed(2)}
                </p>
            </div>
        </Link>
    );
}