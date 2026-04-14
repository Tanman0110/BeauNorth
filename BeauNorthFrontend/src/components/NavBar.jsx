import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, ChevronDown, MapPin, Check } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { getMyCart } from "../api/cartApi";
import { getCategories } from "../api/categoryApi";
import { getProducts } from "../api/productApi";
import { getMyAddresses, updateMyAddress } from "../api/userAddressApi";
import beauNorthLogo from "../assets/beau_north_logo.png";
import "./Navbar.css";

export default function Navbar() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const [cartCount, setCartCount] = useState(0);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [addresses, setAddresses] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);

    const searchRef = useRef(null);
    const addressRef = useRef(null);
    const accountRef = useRef(null);

    useEffect(() => {
        async function loadNavData() {
            try {
                const [categoryData, productData] = await Promise.all([
                    getCategories(),
                    getProducts()
                ]);

                setCategories(categoryData.filter((category) => category.isActive));
                setProducts(productData.filter((product) => product.isActive));
            } catch {
                setCategories([]);
                setProducts([]);
            }
        }

        loadNavData();
    }, []);

    useEffect(() => {
        async function loadUserData() {
            try {
                if (isAuthenticated) {
                    const [cart, userAddresses] = await Promise.all([
                        getMyCart(),
                        getMyAddresses()
                    ]);

                    const count = (cart?.cartItems || []).reduce(
                        (total, item) => total + item.quantity,
                        0
                    );

                    setCartCount(count);
                    setAddresses(userAddresses || []);
                } else {
                    setCartCount(0);
                    setAddresses([]);
                }
            } catch {
                setCartCount(0);
                setAddresses([]);
            }
        }

        loadUserData();

        window.addEventListener("cart-updated", loadUserData);
        window.addEventListener("addresses-updated", loadUserData);

        return () => {
            window.removeEventListener("cart-updated", loadUserData);
            window.removeEventListener("addresses-updated", loadUserData);
        };
    }, [isAuthenticated]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchSuggestions(false);
            }

            if (addressRef.current && !addressRef.current.contains(event.target)) {
                setShowAddressDropdown(false);
            }

            if (accountRef.current && !accountRef.current.contains(event.target)) {
                setShowAccountDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const sortedAddresses = useMemo(() => {
        if (!addresses.length) return [];

        const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];

        return [
            defaultAddress,
            ...addresses.filter(
                (address) => address.userAddressId !== defaultAddress.userAddressId
            )
        ];
    }, [addresses]);

    const primaryAddress = useMemo(() => {
        return sortedAddresses[0] || null;
    }, [sortedAddresses]);

    const searchSuggestions = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) {
            return [];
        }

        const categoryMatches = categories
            .filter((category) => category.name.toLowerCase().includes(term))
            .map((category) => ({
                type: "category",
                id: category.categoryId,
                label: category.name
            }));

        const productMatches = products
            .filter((product) =>
                product.name.toLowerCase().includes(term) ||
                (product.description || "").toLowerCase().includes(term)
            )
            .map((product) => ({
                type: "product",
                id: product.productId,
                label: product.name
            }));

        return [...categoryMatches, ...productMatches].slice(0, 6);
    }, [searchTerm, categories, products]);

    function handleLogout() {
        logout();
        setShowAccountDropdown(false);
        navigate("/");
    }

    function handleSearchSubmit(event) {
        event.preventDefault();

        const term = searchTerm.trim();
        if (!term) return;

        setShowSearchSuggestions(false);
        navigate(`/products?search=${encodeURIComponent(term)}`);
    }

    function handleSuggestionClick(suggestion) {
        setShowSearchSuggestions(false);
        setSearchTerm("");

        if (suggestion.type === "category") {
            navigate(`/categories/${suggestion.id}`);
            return;
        }

        navigate(`/products/${suggestion.id}`);
    }

    async function handleSelectAddress(address) {
        try {
            if (address.isDefault) {
                setShowAddressDropdown(false);
                return;
            }

            await updateMyAddress(address.userAddressId, {
                fullName: address.fullName,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2 || "",
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
                isDefault: true
            });

            const refreshedAddresses = await getMyAddresses();
            setAddresses(refreshedAddresses || []);
            window.dispatchEvent(new Event("addresses-updated"));
            setShowAddressDropdown(false);
        } catch {
            setShowAddressDropdown(false);
        }
    }

    return (
        <header className="site-header">
            <div className="navbar-top">
                <div className="navbar-logo-wrap">
                    <Link to="/" className="navbar-logo">
                        <img
                            src={beauNorthLogo}
                            alt="Beau North"
                            className="navbar-logo-image"
                        />
                    </Link>
                </div>

                <div className="navbar-shipping-slot">
                    {isAuthenticated && primaryAddress && (
                        <div className="navbar-shipping" ref={addressRef}>
                            <button
                                className="navbar-shipping-button"
                                type="button"
                                onClick={() => {
                                    setShowAccountDropdown(false);
                                    setShowAddressDropdown((prev) => !prev);
                                }}
                            >
                                <MapPin size={15} />
                                <div className="navbar-shipping-text">
                                    <span className="navbar-shipping-label">Delivering to</span>
                                    <span className="navbar-shipping-value">
                                        {primaryAddress.addressLine1}
                                    </span>
                                </div>
                                <ChevronDown size={15} />
                            </button>

                            {showAddressDropdown && (
                                <div className="navbar-address-dropdown">
                                    {sortedAddresses.map((address) => {
                                        const isSelected = address.isDefault;

                                        return (
                                            <button
                                                key={address.userAddressId}
                                                type="button"
                                                className={`navbar-address-item${isSelected ? " navbar-address-item-selected" : ""}`}
                                                onClick={() => handleSelectAddress(address)}
                                            >
                                                <div className="navbar-address-item-content">
                                                    <strong>{address.fullName}</strong>
                                                    <span>{address.addressLine1}</span>
                                                    {address.addressLine2 && <span>{address.addressLine2}</span>}
                                                    <span>
                                                        {address.city}, {address.state} {address.postalCode}
                                                    </span>
                                                </div>

                                                {isSelected && (
                                                    <Check size={16} className="navbar-address-check" />
                                                )}
                                            </button>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        className="navbar-address-manage"
                                        onClick={() => {
                                            setShowAddressDropdown(false);
                                            navigate("/account");
                                        }}
                                    >
                                        Manage addresses
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="navbar-search-slot" ref={searchRef}>
                    <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            placeholder="Search Beau North"
                            className="navbar-search"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSearchSuggestions(true);
                            }}
                            onFocus={() => setShowSearchSuggestions(true)}
                        />
                    </form>

                    {showSearchSuggestions && searchSuggestions.length > 0 && (
                        <div className="navbar-search-suggestions">
                            {searchSuggestions.map((suggestion, index) => (
                                <button
                                    key={`${suggestion.type}-${suggestion.id}-${index}`}
                                    type="button"
                                    className="navbar-search-suggestion"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <span className="navbar-search-suggestion-label">
                                        {suggestion.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <nav className="navbar-right">
                    {isAuthenticated ? (
                        <div className="navbar-account" ref={accountRef}>
                            <button
                                type="button"
                                className="navbar-account-button"
                                onClick={() => {
                                    setShowAddressDropdown(false);
                                    setShowAccountDropdown((prev) => !prev);
                                }}
                            >
                                Hello, {user?.firstName}
                                <ChevronDown size={15} />
                            </button>

                            {showAccountDropdown && (
                                <div className="navbar-account-dropdown">
                                    <button
                                        type="button"
                                        className="navbar-account-item"
                                        onClick={() => {
                                            setShowAccountDropdown(false);
                                            navigate("/account");
                                        }}
                                    >
                                        Account
                                    </button>

                                    <button
                                        type="button"
                                        className="navbar-account-item"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="navbar-link">
                            Sign In
                        </Link>
                    )}

                    {isAuthenticated && (
                        <Link to="/orders" className="navbar-link">
                            Orders
                        </Link>
                    )}

                    <Link to="/cart" className="navbar-cart-link">
                        <span className="navbar-cart-left">
                            <ShoppingCart size={16} />
                            <span>Cart</span>
                        </span>
                        <span className="navbar-cart-count">{cartCount}</span>
                    </Link>
                </nav>
            </div>

            <div className="navbar-sub">
                <Link to="/categories" className="navbar-sub-link">
                    All
                </Link>

                {categories
                    .filter((category) => category.name?.toLowerCase() !== "archive")
                    .slice(0, 20)
                    .map((category) => (
                        <Link
                            key={category.categoryId}
                            to={`/categories/${category.categoryId}`}
                            className="navbar-sub-link"
                        >
                            {category.name}
                        </Link>
                    ))}
            </div>
        </header>
    );
}