import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api/productApi";
import ProductCard from "../components/ProductCard";
import { groupProductsForDisplay } from "../utils/productGrouping";
import "./ProductsPage.css";

const PRODUCTS_PER_PAGE = 20;

function formatPriceInput(value) {
    const digitsOnly = value.replace(/\D/g, "");

    if (!digitsOnly) {
        return "";
    }

    return `$${Number(digitsOnly).toLocaleString("en-US")}`;
}

function parsePriceInput(value) {
    const digitsOnly = value.replace(/\D/g, "");

    if (!digitsOnly) {
        return "";
    }

    return Number(digitsOnly);
}

export default function ProductsPage() {
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get("search") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedAudience, setSelectedAudience] = useState("All");

    const [minPriceInput, setMinPriceInput] = useState("");
    const [maxPriceInput, setMaxPriceInput] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setSearchTerm(initialSearch);
    }, [initialSearch]);

    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await getProducts();
                const grouped = groupProductsForDisplay(
                    data.filter((product) => product.isActive)
                );
                setProducts(grouped);
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

    const audiences = useMemo(() => {
        const audienceValues = products
            .map((product) => product.audience)
            .filter(Boolean);

        return ["All", ...new Set(audienceValues)];
    }, [products]);

    const minPrice = useMemo(() => parsePriceInput(minPriceInput), [minPriceInput]);
    const maxPrice = useMemo(() => parsePriceInput(maxPriceInput), [maxPriceInput]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const productPrice = Number(product.price);
            const searchableDescription =
                product.shortDescription ||
                product.description ||
                "";

            const matchesSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                searchableDescription.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory =
                selectedCategory === "All" || product.category?.name === selectedCategory;

            const matchesAudience =
                selectedAudience === "All" || product.audience === selectedAudience;

            const matchesMinPrice =
                minPrice === "" || productPrice >= minPrice;

            const matchesMaxPrice =
                maxPrice === "" || productPrice <= maxPrice;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesAudience &&
                matchesMinPrice &&
                matchesMaxPrice
            );
        });
    }, [products, searchTerm, selectedCategory, selectedAudience, minPrice, maxPrice]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedAudience, minPriceInput, maxPriceInput]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        if (currentPage <= 3) {
            pages.push(1, 2, 3, 4, "...", totalPages);
            return pages;
        }

        if (currentPage >= totalPages - 2) {
            pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            return pages;
        }

        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
        return pages;
    };

    if (loading) {
        return <p className="products-status loading-screen-space">Loading products...</p>;
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

                    <select
                        className="products-filter-input"
                        value={selectedAudience}
                        onChange={(e) => setSelectedAudience(e.target.value)}
                    >
                        {audiences.map((audience) => (
                            <option key={audience} value={audience}>
                                {audience}
                            </option>
                        ))}
                    </select>

                    <input
                        className="products-filter-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="Min price"
                        value={minPriceInput}
                        onChange={(e) => setMinPriceInput(formatPriceInput(e.target.value))}
                    />

                    <input
                        className="products-filter-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="Max price"
                        value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput(formatPriceInput(e.target.value))}
                    />
                </div>

                <div className="products-results-summary">
                    Showing {paginatedProducts.length === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1}
                    {" - "}
                    {Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
                </div>

                <div className="products-grid">
                    {paginatedProducts.length > 0 ? (
                        paginatedProducts.map((product) => (
                            <ProductCard key={product.productId} product={product} />
                        ))
                    ) : (
                        <p className="products-empty">No products found.</p>
                    )}
                </div>

                {filteredProducts.length > PRODUCTS_PER_PAGE && (
                    <div className="products-pagination">
                        <button
                            type="button"
                            className="products-pagination-button"
                            onClick={(e) => {
                                e.currentTarget.blur();
                                setCurrentPage((prev) => Math.max(prev - 1, 1));
                            }}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>

                        <div className="products-pagination-pages">
                            {getPageNumbers().map((page, index) =>
                                page === "..." ? (
                                    <span key={`ellipsis-${index}`} className="products-pagination-ellipsis">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        key={page}
                                        className={`products-pagination-button products-page-number ${currentPage === page ? "active" : ""}`}
                                        onClick={(e) => {
                                            e.currentTarget.blur();
                                            setCurrentPage(page);
                                        }}
                                    >
                                        {page}
                                    </button>
                                )
                            )}
                        </div>

                        <button
                            type="button"
                            className="products-pagination-button"
                            onClick={(e) => {
                                e.currentTarget.blur();
                                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                            }}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}