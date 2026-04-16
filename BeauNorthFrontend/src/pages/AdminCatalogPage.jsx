import { useEffect, useMemo, useState } from "react";
import {
    createCategory,
    deleteCategory,
    getAdminCategories,
    updateCategory
} from "../api/adminCategoriesApi";
import {
    createProduct,
    deleteProduct,
    getAdminProducts,
    updateProduct
} from "../api/adminProductsApi";
import { getApliiqConfigStatus } from "../api/apliiqAdminApi";
import "./AdminCatalogPage.css";

const CATEGORY_PAGE_SIZE = 10;
const PRODUCT_PAGE_SIZE = 10;

const emptyCategory = {
    name: "",
    description: "",
    isActive: true
};

const emptyProduct = {
    categoryId: "",
    name: "",
    description: "",
    price: "",
    baseCost: "",
    imageUrl: "",
    sizeOptions: "",
    colorOptions: "",
    stockQuantity: "",
    sku: "",
    audience: "All",
    fulfillmentProvider: "Manual",
    externalProductId: "",
    externalVariantId: "",
    externalDesignId: "",
    externalSku: "",
    isFulfillmentEnabled: false,
    isActive: true
};

export default function AdminCatalogPage() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [categoryForm, setCategoryForm] = useState(emptyCategory);
    const [productForm, setProductForm] = useState(emptyProduct);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingProductId, setEditingProductId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [apliiqStatus, setApliiqStatus] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
    const [categoryPage, setCategoryPage] = useState(1);
    const [productPage, setProductPage] = useState(1);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError("");

        try {
            const [categoriesData, productsData] = await Promise.all([
                getAdminCategories(),
                getAdminProducts()
            ]);

            setCategories(categoriesData);
            setProducts(productsData);

            const role = localStorage.getItem("role");
            if (role === "Admin") {
                try {
                    const apliiqData = await getApliiqConfigStatus();
                    setApliiqStatus(apliiqData);
                } catch {
                    setApliiqStatus({ isValid: false });
                }
            } else {
                setApliiqStatus(null);
            }
        } catch (err) {
            setError(err.message || "Failed to load admin data.");
        } finally {
            setLoading(false);
        }
    }

    function handleCategoryChange(event) {
        const { name, value, type, checked } = event.target;
        setCategoryForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function handleProductChange(event) {
        const { name, value, type, checked } = event.target;
        setProductForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    async function handleCategorySubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const payload = {
                name: categoryForm.name.trim(),
                description: categoryForm.description.trim() || null,
                isActive: categoryForm.isActive
            };

            if (editingCategoryId) {
                await updateCategory(editingCategoryId, payload);
                setMessage("Category updated.");
            } else {
                await createCategory(payload);
                setMessage("Category created.");
            }

            setCategoryForm(emptyCategory);
            setEditingCategoryId(null);
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to save category.");
        } finally {
            setSaving(false);
        }
    }

    async function handleProductSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const payload = {
                categoryId: Number(productForm.categoryId),
                name: productForm.name.trim(),
                description: productForm.description.trim() || null,
                price: Number(productForm.price),
                baseCost: Number(productForm.baseCost || 0),
                imageUrl: productForm.imageUrl.trim() || null,
                sizeOptions: productForm.sizeOptions.trim() || null,
                colorOptions: productForm.colorOptions.trim() || null,
                stockQuantity: Number(productForm.stockQuantity || 0),
                sku: productForm.sku.trim().toUpperCase(),
                audience: productForm.audience,
                fulfillmentProvider: productForm.fulfillmentProvider,
                externalProductId: productForm.externalProductId.trim() || null,
                externalVariantId: productForm.externalVariantId.trim() || null,
                externalDesignId: productForm.externalDesignId.trim() || null,
                externalSku: productForm.externalSku.trim() || null,
                isFulfillmentEnabled: productForm.isFulfillmentEnabled,
                isActive: productForm.isActive
            };

            if (editingProductId) {
                await updateProduct(editingProductId, payload);
                setMessage("Product updated.");
            } else {
                await createProduct(payload);
                setMessage("Product created.");
            }

            setProductForm(emptyProduct);
            setEditingProductId(null);
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to save product.");
        } finally {
            setSaving(false);
        }
    }

    function startEditCategory(category) {
        setEditingCategoryId(category.categoryId);
        setCategoryForm({
            name: category.name || "",
            description: category.description || "",
            isActive: category.isActive
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function startEditProduct(product) {
        setEditingProductId(product.productId);
        setProductForm({
            categoryId: String(product.categoryId ?? ""),
            name: product.name || "",
            description: product.description || "",
            price: String(product.price ?? ""),
            baseCost: String(product.baseCost ?? 0),
            imageUrl: product.imageUrl || "",
            sizeOptions: product.sizeOptions || "",
            colorOptions: product.colorOptions || "",
            stockQuantity: String(product.stockQuantity ?? 0),
            sku: product.sku || "",
            audience: product.audience || "All",
            fulfillmentProvider: product.fulfillmentProvider || "Manual",
            externalProductId: product.externalProductId || "",
            externalVariantId: product.externalVariantId || "",
            externalDesignId: product.externalDesignId || "",
            externalSku: product.externalSku || "",
            isFulfillmentEnabled: !!product.isFulfillmentEnabled,
            isActive: !!product.isActive
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleDeleteCategory(id) {
        const confirmed = window.confirm("Deactivate this category?");
        if (!confirmed) return;

        try {
            await deleteCategory(id);
            setMessage("Category deactivated.");
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to deactivate category.");
        }
    }

    async function handleDeleteProduct(id) {
        const confirmed = window.confirm("Deactivate this product?");
        if (!confirmed) return;

        try {
            await deleteProduct(id);
            setMessage("Product deactivated.");
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to deactivate product.");
        }
    }

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();

        return products.filter((product) => {
            const matchesSearch =
                !term ||
                product.name?.toLowerCase().includes(term) ||
                product.sku?.toLowerCase().includes(term) ||
                product.externalSku?.toLowerCase().includes(term) ||
                product.fulfillmentProvider?.toLowerCase().includes(term) ||
                product.category?.name?.toLowerCase().includes(term) ||
                product.audience?.toLowerCase().includes(term);

            const matchesCategory =
                selectedCategoryFilter === "All" ||
                String(product.categoryId) === selectedCategoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [products, search, selectedCategoryFilter]);

    const totalCategoryPages = Math.max(1, Math.ceil(categories.length / CATEGORY_PAGE_SIZE));
    const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCT_PAGE_SIZE));

    useEffect(() => {
        if (categoryPage > totalCategoryPages) {
            setCategoryPage(totalCategoryPages);
        }
    }, [categoryPage, totalCategoryPages]);

    useEffect(() => {
        if (productPage > totalProductPages) {
            setProductPage(totalProductPages);
        }
    }, [productPage, totalProductPages]);

    useEffect(() => {
        setProductPage(1);
    }, [search, selectedCategoryFilter]);

    const pagedCategories = useMemo(() => {
        const start = (categoryPage - 1) * CATEGORY_PAGE_SIZE;
        return categories.slice(start, start + CATEGORY_PAGE_SIZE);
    }, [categories, categoryPage]);

    const pagedProducts = useMemo(() => {
        const start = (productPage - 1) * PRODUCT_PAGE_SIZE;
        return filteredProducts.slice(start, start + PRODUCT_PAGE_SIZE);
    }, [filteredProducts, productPage]);

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-card">Loading admin catalog...</div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1>Admin Catalog</h1>
                    <p>Manage Beau North categories, products, and Apliiq-linked fulfillment mappings.</p>
                </div>

                {apliiqStatus ? (
                    <div className={`status-pill ${apliiqStatus.isValid ? "good" : "bad"}`}>
                        Apliiq {apliiqStatus.isValid ? "connected" : "not connected"}
                    </div>
                ) : null}
            </div>

            {message ? <div className="admin-alert success">{message}</div> : null}
            {error ? <div className="admin-alert error">{error}</div> : null}

            <div className="admin-grid">
                <section className="admin-card">
                    <h2>{editingCategoryId ? "Edit Category" : "Add Category"}</h2>

                    <form onSubmit={handleCategorySubmit} className="admin-form">
                        <label>
                            Name
                            <input
                                name="name"
                                value={categoryForm.name}
                                onChange={handleCategoryChange}
                                required
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                name="description"
                                value={categoryForm.description}
                                onChange={handleCategoryChange}
                                rows="3"
                            />
                        </label>

                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={categoryForm.isActive}
                                onChange={handleCategoryChange}
                            />
                            Active
                        </label>

                        <div className="button-row">
                            <button type="submit" disabled={saving}>
                                {editingCategoryId ? "Save Category" : "Create Category"}
                            </button>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                    setEditingCategoryId(null);
                                    setCategoryForm(emptyCategory);
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </section>

                <section className="admin-card admin-card-wide">
                    <h2>{editingProductId ? "Edit Product" : "Add Product"}</h2>

                    <form onSubmit={handleProductSubmit} className="admin-form admin-form-grid">
                        <label>
                            Category
                            <select
                                name="categoryId"
                                value={productForm.categoryId}
                                onChange={handleProductChange}
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map((category) => (
                                    <option key={category.categoryId} value={category.categoryId}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Product Name
                            <input
                                name="name"
                                value={productForm.name}
                                onChange={handleProductChange}
                                required
                            />
                        </label>

                        <label className="span-2">
                            Description
                            <textarea
                                name="description"
                                value={productForm.description}
                                onChange={handleProductChange}
                                rows="3"
                            />
                        </label>

                        <label>
                            Price
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                value={productForm.price}
                                onChange={handleProductChange}
                                required
                            />
                        </label>

                        <label>
                            Base Cost
                            <input
                                name="baseCost"
                                type="number"
                                step="0.01"
                                value={productForm.baseCost}
                                onChange={handleProductChange}
                                required
                            />
                        </label>

                        <label>
                            Audience
                            <select
                                name="audience"
                                value={productForm.audience}
                                onChange={handleProductChange}
                            >
                                <option value="All">All</option>
                                <option value="Men">Men</option>
                                <option value="Women">Women</option>
                                <option value="Children">Children</option>
                            </select>
                        </label>

                        <label>
                            Stock Quantity
                            <input
                                name="stockQuantity"
                                type="number"
                                value={productForm.stockQuantity}
                                onChange={handleProductChange}
                                required
                            />
                        </label>

                        <label className="span-2">
                            Image URL
                            <input
                                name="imageUrl"
                                value={productForm.imageUrl}
                                onChange={handleProductChange}
                            />
                        </label>

                        <label>
                            Size Options
                            <input
                                name="sizeOptions"
                                value={productForm.sizeOptions}
                                onChange={handleProductChange}
                                placeholder="S,M,L,XL"
                            />
                        </label>

                        <label>
                            Color Options
                            <input
                                name="colorOptions"
                                value={productForm.colorOptions}
                                onChange={handleProductChange}
                                placeholder="Black,Cream,Forest"
                            />
                        </label>

                        <label>
                            SKU
                            <input
                                name="sku"
                                value={productForm.sku}
                                onChange={handleProductChange}
                                required
                            />
                        </label>

                        <label>
                            Fulfillment Provider
                            <select
                                name="fulfillmentProvider"
                                value={productForm.fulfillmentProvider}
                                onChange={handleProductChange}
                            >
                                <option value="Manual">Manual</option>
                                <option value="Apliiq">Apliiq</option>
                            </select>
                        </label>

                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                name="isFulfillmentEnabled"
                                checked={productForm.isFulfillmentEnabled}
                                onChange={handleProductChange}
                            />
                            Fulfillment Enabled
                        </label>

                        <label>
                            External Product ID
                            <input
                                name="externalProductId"
                                value={productForm.externalProductId}
                                onChange={handleProductChange}
                            />
                        </label>

                        <label>
                            External Variant ID
                            <input
                                name="externalVariantId"
                                value={productForm.externalVariantId}
                                onChange={handleProductChange}
                            />
                        </label>

                        <label>
                            External Design ID
                            <input
                                name="externalDesignId"
                                value={productForm.externalDesignId}
                                onChange={handleProductChange}
                            />
                        </label>

                        <label>
                            External Supplier SKU
                            <input
                                name="externalSku"
                                value={productForm.externalSku}
                                onChange={handleProductChange}
                            />
                        </label>

                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={productForm.isActive}
                                onChange={handleProductChange}
                            />
                            Active
                        </label>

                        <div className="button-row span-2">
                            <button type="submit" disabled={saving}>
                                {editingProductId ? "Save Product" : "Create Product"}
                            </button>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                    setEditingProductId(null);
                                    setProductForm(emptyProduct);
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </section>
            </div>

            <section className="admin-card">
                <div className="table-header">
                    <h2>Categories</h2>
                </div>

                <div className="simple-table">
                    {pagedCategories.map((category) => (
                        <div key={category.categoryId} className="table-row">
                            <div>
                                <strong>{category.name}</strong>
                                <div className="subtle">{category.description || "No description"}</div>
                            </div>

                            <div className="pill-group">
                                <span className={`mini-pill ${category.isActive ? "good" : "muted"}`}>
                                    {category.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="button-row compact">
                                <button type="button" onClick={() => startEditCategory(category)}>Edit</button>
                                <button type="button" className="secondary" onClick={() => handleDeleteCategory(category.categoryId)}>
                                    Deactivate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pagination-row">
                    <button
                        type="button"
                        className="secondary"
                        disabled={categoryPage === 1}
                        onClick={() => setCategoryPage((prev) => prev - 1)}
                    >
                        Previous
                    </button>
                    <span>Page {categoryPage} of {totalCategoryPages}</span>
                    <button
                        type="button"
                        className="secondary"
                        disabled={categoryPage === totalCategoryPages}
                        onClick={() => setCategoryPage((prev) => prev + 1)}
                    >
                        Next
                    </button>
                </div>
            </section>

            <section className="admin-card">
                <div className="table-header filters-header">
                    <h2>Products</h2>

                    <div className="filters-group">
                        <select
                            className="filter-select"
                            value={selectedCategoryFilter}
                            onChange={(event) => setSelectedCategoryFilter(event.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.categoryId} value={String(category.categoryId)}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        <input
                            className="search-input"
                            placeholder="Search products"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                <div className="simple-table">
                    {pagedProducts.map((product) => (
                        <div key={product.productId} className="table-row product-row">
                            <div>
                                <strong>{product.name}</strong>
                                <div className="subtle">
                                    {product.category?.name || "No category"} · {product.sku} · {product.audience || "All"}
                                </div>
                                <div className="subtle">
                                    Provider: {product.fulfillmentProvider || "Manual"}
                                    {product.externalSku ? ` · External SKU: ${product.externalSku}` : ""}
                                </div>
                            </div>

                            <div className="pill-group">
                                <span className="mini-pill">${Number(product.price).toFixed(2)}</span>
                                <span className={`mini-pill ${product.isFulfillmentEnabled ? "good" : "muted"}`}>
                                    {product.isFulfillmentEnabled ? "Fulfilled" : "Manual"}
                                </span>
                                <span className={`mini-pill ${product.isActive ? "good" : "muted"}`}>
                                    {product.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="button-row compact">
                                <button type="button" onClick={() => startEditProduct(product)}>Edit</button>
                                <button type="button" className="secondary" onClick={() => handleDeleteProduct(product.productId)}>
                                    Deactivate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pagination-row">
                    <button
                        type="button"
                        className="secondary"
                        disabled={productPage === 1}
                        onClick={() => setProductPage((prev) => prev - 1)}
                    >
                        Previous
                    </button>
                    <span>Page {productPage} of {totalProductPages}</span>
                    <button
                        type="button"
                        className="secondary"
                        disabled={productPage === totalProductPages}
                        onClick={() => setProductPage((prev) => prev + 1)}
                    >
                        Next
                    </button>
                </div>
            </section>
        </div>
    );
}