import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts } from "../api/productApi";
import { motion } from "framer-motion";
import mascot from "../assets/mascot.jpeg";
import "./HomePage.css";

function shuffleArray(items) {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [centerIndex, setCenterIndex] = useState(2);
    const [loading, setLoading] = useState(true);
    const autoRotateRef = useRef(null);

    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await getProducts();
                const activeProducts = data.filter((product) => product.isActive);
                setProducts(shuffleArray(activeProducts));
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, []);

    useEffect(() => {
        resetAutoRotate();

        return () => {
            if (autoRotateRef.current) {
                clearInterval(autoRotateRef.current);
            }
        };
    }, [products]);

    function moveLeft() {
        setCenterIndex((prev) => (prev + 1) % products.length);
        resetAutoRotate();
    }

    function moveRight() {
        setCenterIndex((prev) =>
            prev === 0 ? products.length - 1 : prev - 1
        );
        resetAutoRotate();
    }

    function getCardAnimation(offset) {
        if (offset === 0) {
            return {
                scale: 1.08,
                opacity: 1,
                zIndex: 3
            };
        }

        if (offset === -1 || offset === 1) {
            return {
                scale: 0.93,
                opacity: 0.94,
                zIndex: 2
            };
        }

        return {
            scale: 0.84,
            opacity: 0.82,
            zIndex: 1
        };
    }

    function resetAutoRotate() {
        if (autoRotateRef.current) {
            clearInterval(autoRotateRef.current);
        }

        if (products.length < 5) return;

        autoRotateRef.current = setInterval(() => {
            setCenterIndex((prev) => (prev + 1) % products.length);
        }, 5000);
    }

    const visibleProducts = useMemo(() => {
        if (products.length < 5) return [];

        const orderedProducts = [
            products[centerIndex % products.length],
            products[(centerIndex + 1) % products.length],
            products[(centerIndex + 2) % products.length],
            products[(centerIndex + 3) % products.length],
            products[(centerIndex + 4) % products.length]
        ];

        const offsets = [-2, -1, 0, 1, 2];

        return orderedProducts.map((product, index) => ({
            product,
            offset: offsets[index]
        }));
    }, [products, centerIndex]);

    return (
        <main className="home-page">
            <section className="home-hero">
                <div className="home-hero-copy">
                    <p className="home-eyebrow">Modern essentials</p>
                    <h1 className="home-title">
                        Clean everyday pieces with a sharp, refined feel.
                    </h1>
                    <p className="home-description">
                        Discover Beau North staples built for daily wear,
                        streamlined style, and a polished modern look.
                    </p>

                    <div className="home-actions">
                        <Link to="/products" className="home-button home-button-primary">
                            Shop Products
                        </Link>
                        <Link to="/categories" className="home-button home-button-secondary">
                            Browse Categories
                        </Link>
                    </div>
                </div>

                <div className="home-hero-panel-content">
                    <p className="home-hero-panel-eyebrow">Beau North</p>
                    <h2>Meet our Mascot!</h2>
                    <img
                        src={mascot}
                        alt="Beau North mascot"
                        className="home-hero-mascot"
                    />
                </div>
            </section>

            <section className="home-carousel-section">
                <div className="home-section-header">
                    <h2>Featured Picks</h2>
                </div>

                {!loading && visibleProducts.length === 5 && (
                    <div className="home-carousel">
                        <button
                            type="button"
                            className="home-carousel-arrow home-carousel-arrow-left"
                            onClick={moveLeft}
                        >
                            <ChevronLeft size={26} />
                        </button>

                        <div className="home-carousel-track">
                            {visibleProducts.map(({ product, offset }) => (
                                <motion.div
                                    key={product.productId}
                                    layout
                                    className="home-carousel-motion-card"
                                    animate={getCardAnimation(offset)}
                                    transition={{
                                        type: "spring",
                                        stiffness: 90,
                                        damping: 18,
                                        mass: 1.1
                                    }}
                                >
                                    <Link
                                        to={`/products/${product.productId}`}
                                        className="home-carousel-card"
                                    >
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="home-carousel-image"
                                        />
                                        <div className="home-carousel-card-body">
                                            <p className="home-carousel-category">
                                                {product.category?.name || "Product"}
                                            </p>
                                            <h3 className="home-carousel-name">{product.name}</h3>
                                            <p className="home-carousel-price">
                                                ${Number(product.price).toFixed(2)}
                                            </p>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="home-carousel-arrow home-carousel-arrow-right"
                            onClick={moveRight}
                        >
                            <ChevronRight size={26} />
                        </button>
                    </div>
                )}
            </section>

            <section className="home-highlights">
                <div className="home-highlight-card">
                    <h3>Refined everyday wear</h3>
                    <p>
                        Built around versatile silhouettes, neutral tones, and
                        simple pieces that work across the week.
                    </p>
                </div>

                <div className="home-highlight-card">
                    <h3>Easy category shopping</h3>
                    <p>
                        Browse by hoodies, tees, accessories, and more without
                        digging through everything at once.
                    </p>
                </div>

                <div className="home-highlight-card">
                    <h3>Made for a clean storefront</h3>
                    <p>
                        Focused layout, polished navigation, and a shopping flow
                        designed to feel smooth and professional.
                    </p>
                </div>
            </section>
        </main>
    );
}