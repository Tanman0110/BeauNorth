import { useEffect, useMemo, useState } from "react";
import { Bold, Italic, List, ListOrdered, Link2 } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
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
const SIZE_OPTIONS = ["One Size", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const emptyCategory = {
    name: "",
    description: "",
    isActive: true
};

const emptyProduct = {
    categoryId: "",
    name: "",
    shortDescription: "",
    longDescriptionHtml: "",
    price: "",
    baseCost: "",
    stockQuantity: "9999",
    audience: "All",
    fulfillmentProvider: "Manual",
    externalSku: "",
    isFulfillmentEnabled: false,
    isActive: true,
    selectedSizes: [],
    colorOptions: [],
    productImages: []
};

function sanitizeCurrencyRaw(value) {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length <= 1) {
        return cleaned;
    }

    return `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
}

function parseCurrencyInput(value) {
    const sanitized = sanitizeCurrencyRaw(String(value || ""));
    if (!sanitized) {
        return 0;
    }

    const parsed = Number.parseFloat(sanitized);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return parsed;
}

function formatCurrencyDisplay(value) {
    if (value === "" || value === null || value === undefined) {
        return "";
    }

    const numeric = parseCurrencyInput(value);

    return `$${numeric.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function unformatCurrencyDisplay(value) {
    return sanitizeCurrencyRaw(String(value || ""));
}

function normalizeProductImages(productImages) {
    if (!Array.isArray(productImages)) {
        return [];
    }

    return productImages.map((image, index) => ({
        id: image.id ?? image.productImageId ?? `${image.colorName || "image"}-${index}-${Date.now()}`,
        colorName: image.colorName || "",
        imageUrl: image.imageUrl || "",
        isPrimary: !!image.isPrimary
    }));
}

function buildInternalSku(productName, color, size) {
    function clean(value) {
        if (!value) {
            return "NA";
        }

        return value
            .toUpperCase()
            .replace(/[^A-Z0-9 ]/g, "")
            .trim()
            .replace(/\s+/g, "-") || "NA";
    }

    return `BN-${clean(productName)}-${clean(color)}-${clean(size)}`;
}

function buildGeneratedVariants(productForm) {
    const colors = productForm.colorOptions || [];
    const sizes = productForm.selectedSizes.length > 0 ? productForm.selectedSizes : [];

    const combos = [];

    for (const color of colors) {
        for (const size of sizes) {
            combos.push({
                colorName: color,
                sizeName: size,
                externalSku: productForm.externalSku.trim(),
                internalSku: buildInternalSku(productForm.name, color, size)
            });
        }
    }

    return combos;
}

function LongDescriptionEditor({ value, onChange }) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                blockquote: false
            }),
            Link.configure({
                openOnClick: false
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"]
            })
        ],
        content: value || "",
        onUpdate: ({ editor: currentEditor }) => {
            onChange(currentEditor.getHTML());
        }
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        const currentHtml = editor.getHTML();
        const nextHtml = value || "";

        if (currentHtml !== nextHtml) {
            editor.commands.setContent(nextHtml, false);
        }
    }, [editor, value]);

    if (!editor) {
        return <div className="editor-shell">Loading editor...</div>;
    }

    return (
        <div className="editor-shell">
            <div className="editor-toolbar">
                <button
                    type="button"
                    className={editor.isActive("bold") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                >
                    <Bold size={16} />
                </button>

                <button
                    type="button"
                    className={editor.isActive("italic") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic"
                >
                    <Italic size={16} />
                </button>

                <button
                    type="button"
                    className={editor.isActive("bulletList") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Bullets"
                >
                    <List size={16} />
                </button>

                <button
                    type="button"
                    className={editor.isActive("orderedList") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Numbered List"
                >
                    <ListOrdered size={16} />
                </button>

                <button
                    type="button"
                    className={editor.isActive("link") ? "active" : ""}
                    onClick={() => {
                        const previous = editor.getAttributes("link").href || "";
                        const url = window.prompt("Enter link URL", previous);

                        if (url === null) {
                            return;
                        }

                        if (url === "") {
                            editor.chain().focus().unsetLink().run();
                            return;
                        }

                        editor.chain().focus().setLink({ href: url }).run();
                    }}
                    title="Link"
                >
                    <Link2 size={16} />
                </button>
            </div>

            <EditorContent editor={editor} className="tiptap-editor" />
        </div>
    );
}

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
    const [apliiqStatus, setApliiqStatus] = useState({ isValid: false });
    const [search, setSearch] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
    const [categoryPage, setCategoryPage] = useState(1);
    const [productPage, setProductPage] = useState(1);
    const [newImageColor, setNewImageColor] = useState("");
    const [newImageUrl, setNewImageUrl] = useState("");
    const [newColor, setNewColor] = useState("");

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

            try {
                const apliiqData = await getApliiqConfigStatus();
                setApliiqStatus({ isValid: !!apliiqData?.isValid });
            } catch {
                setApliiqStatus({ isValid: false });
            }
        } catch (err) {
            setError(err.message || "Failed to load admin data.");
            setApliiqStatus({ isValid: false });
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

    function toggleSelectedSize(size) {
        setProductForm((prev) => {
            const exists = prev.selectedSizes.includes(size);

            return {
                ...prev,
                selectedSizes: exists
                    ? prev.selectedSizes.filter((item) => item !== size)
                    : [...prev.selectedSizes, size]
            };
        });
    }

    function addColorChip() {
        const color = newColor.trim();
        if (!color) {
            return;
        }

        setProductForm((prev) => {
            const exists = prev.colorOptions.some(
                (item) => item.toLowerCase() === color.toLowerCase()
            );

            if (exists) {
                return prev;
            }

            return {
                ...prev,
                colorOptions: [...prev.colorOptions, color]
            };
        });

        setNewColor("");
    }

    function removeColorChip(colorToRemove) {
        setProductForm((prev) => ({
            ...prev,
            colorOptions: prev.colorOptions.filter((color) => color !== colorToRemove),
            productImages: prev.productImages.filter((image) => image.colorName !== colorToRemove)
        }));
    }

    function addProductImageMapping() {
        const colorName = newImageColor.trim();
        const imageUrl = newImageUrl.trim();

        if (!colorName || !imageUrl) {
            return;
        }

        setProductForm((prev) => ({
            ...prev,
            productImages: [
                ...prev.productImages,
                {
                    id: `${colorName}-${Date.now()}`,
                    colorName,
                    imageUrl,
                    isPrimary: prev.productImages.length === 0
                }
            ]
        }));

        setNewImageColor("");
        setNewImageUrl("");
    }

    function removeProductImageMapping(id) {
        setProductForm((prev) => {
            const updated = prev.productImages.filter((image) => image.id !== id);

            if (updated.length > 0 && !updated.some((image) => image.isPrimary)) {
                updated[0] = {
                    ...updated[0],
                    isPrimary: true
                };
            }

            return {
                ...prev,
                productImages: updated
            };
        });
    }

    function setPrimaryProductImage(id) {
        setProductForm((prev) => ({
            ...prev,
            productImages: prev.productImages.map((image) => ({
                ...image,
                isPrimary: image.id === id
            }))
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
            if (!productForm.categoryId) {
                throw new Error("Select a category.");
            }

            const generatedVariants = buildGeneratedVariants(productForm);

            if (editingProductId) {
                if (generatedVariants.length !== 1) {
                    throw new Error("Editing requires exactly one color and one size selected.");
                }

                const variant = generatedVariants[0];

                const imagesForVariant = productForm.productImages.filter((image) => {
                    if (!image.colorName) {
                        return true;
                    }

                    return image.colorName.toLowerCase() === variant.colorName.toLowerCase();
                });

                const payload = {
                    categoryId: Number(productForm.categoryId),
                    name: productForm.name.trim(),
                    shortDescription: productForm.shortDescription.trim() || null,
                    longDescriptionHtml: productForm.longDescriptionHtml || null,
                    price: parseCurrencyInput(productForm.price),
                    baseCost: parseCurrencyInput(productForm.baseCost),
                    sizeOptions: variant.sizeName,
                    colorOptions: variant.colorName,
                    stockQuantity: Math.max(0, Number(productForm.stockQuantity || 0)),
                    sku: variant.internalSku,
                    audience: productForm.audience,
                    fulfillmentProvider: productForm.fulfillmentProvider,
                    externalSku: variant.externalSku || null,
                    isFulfillmentEnabled: productForm.isFulfillmentEnabled,
                    isActive: productForm.isActive,
                    productImages: imagesForVariant.map((image) => ({
                        colorName: image.colorName,
                        imageUrl: image.imageUrl,
                        isPrimary: image.isPrimary
                    }))
                };

                await updateProduct(editingProductId, payload);
                setMessage("Product updated.");
            } else {
                if (generatedVariants.length === 0) {
                    throw new Error("Add at least one color and one size.");
                }

                for (const variant of generatedVariants) {
                    const imagesForVariant = productForm.productImages.filter((image) => {
                        if (!image.colorName) {
                            return true;
                        }

                        return image.colorName.toLowerCase() === variant.colorName.toLowerCase();
                    });

                    const payload = {
                        categoryId: Number(productForm.categoryId),
                        name: productForm.name.trim(),
                        shortDescription: productForm.shortDescription.trim() || null,
                        longDescriptionHtml: productForm.longDescriptionHtml || null,
                        price: parseCurrencyInput(productForm.price),
                        baseCost: parseCurrencyInput(productForm.baseCost),
                        sizeOptions: variant.sizeName,
                        colorOptions: variant.colorName,
                        stockQuantity: Math.max(0, Number(productForm.stockQuantity || 0)),
                        sku: variant.internalSku,
                        audience: productForm.audience,
                        fulfillmentProvider: productForm.fulfillmentProvider,
                        externalSku: variant.externalSku || null,
                        isFulfillmentEnabled: productForm.isFulfillmentEnabled,
                        isActive: productForm.isActive,
                        productImages: imagesForVariant.map((image) => ({
                            colorName: image.colorName,
                            imageUrl: image.imageUrl,
                            isPrimary: image.isPrimary
                        }))
                    };

                    await createProduct(payload);
                }

                setMessage(`${generatedVariants.length} product row(s) created.`);
            }

            setProductForm(emptyProduct);
            setEditingProductId(null);
            setNewImageColor("");
            setNewImageUrl("");
            setNewColor("");
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
            shortDescription: product.shortDescription || "",
            longDescriptionHtml: product.longDescriptionHtml || "",
            price: formatCurrencyDisplay(product.price ?? ""),
            baseCost: formatCurrencyDisplay(product.baseCost ?? ""),
            stockQuantity: String(product.stockQuantity ?? 9999),
            audience: product.audience || "All",
            fulfillmentProvider: product.fulfillmentProvider || "Manual",
            externalSku: product.externalSku || "",
            isFulfillmentEnabled: !!product.isFulfillmentEnabled,
            isActive: !!product.isActive,
            selectedSizes: product.sizeOptions ? [product.sizeOptions] : [],
            colorOptions: product.colorOptions ? [product.colorOptions] : [],
            productImages: normalizeProductImages(product.productImages)
        });

        setNewImageColor("");
        setNewImageUrl("");
        setNewColor("");
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

    const generatedVariantsPreview = useMemo(() => {
        return buildGeneratedVariants(productForm);
    }, [productForm]);

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
                    <p>Manage Beau North categories and bulk-create variant rows.</p>
                </div>

                <div className={`status-pill ${apliiqStatus.isValid ? "good" : "bad"}`}>
                    Apliiq {apliiqStatus.isValid ? "connected" : "not connected"}
                </div>
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
                    <h2>{editingProductId ? "Edit Product Row" : "Add Product Rows"}</h2>

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
                            Short Description
                            <textarea
                                name="shortDescription"
                                value={productForm.shortDescription}
                                onChange={handleProductChange}
                                rows="3"
                                placeholder="Used on product cards and listings."
                            />
                        </label>

                        <div className="span-2 stacked-control">
                            <label className="stack-label">Long Description</label>
                            <LongDescriptionEditor
                                value={productForm.longDescriptionHtml}
                                onChange={(html) =>
                                    setProductForm((prev) => ({
                                        ...prev,
                                        longDescriptionHtml: html
                                    }))
                                }
                            />
                        </div>

                        <label>
                            Price
                            <input
                                name="price"
                                type="text"
                                inputMode="decimal"
                                value={productForm.price}
                                onChange={(e) =>
                                    setProductForm((prev) => ({
                                        ...prev,
                                        price: unformatCurrencyDisplay(e.target.value)
                                    }))
                                }
                                onBlur={() =>
                                    setProductForm((prev) => ({
                                        ...prev,
                                        price: formatCurrencyDisplay(prev.price)
                                    }))
                                }
                                onFocus={() =>
                                    setProductForm((prev) => ({
                                        ...prev,
                                        price: unformatCurrencyDisplay(prev.price)
                                    }))
                                }
                                placeholder="$0.00"
                                required
                            />
                        </label>

                        <label>
                            Base Cost
                            <input
                                name="baseCost"
                                type="text"
                                inputMode="decimal"
                                value={productForm.baseCost}
                                onChange={(e) =>
                                    setProductForm((prev) => ({
                                        ...prev,
                                        baseCost: unformatCurrencyDisplay(e.target.value)
                                    }))
                                }
                                onBlur={() =>
                                    setProductForm((prev) => ({
                                        ...prev,
                                        baseCost: formatCurrencyDisplay(prev.baseCost)
                                    }))
                                }
                                onFocus={() =>
                                    setProductForm((prev) => ({
                                        ...prev,
                                        baseCost: unformatCurrencyDisplay(prev.baseCost)
                                    }))
                                }
                                placeholder="$0.00"
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
                                min="0"
                                step="1"
                                value={productForm.stockQuantity}
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

                        <label>
                            External Supplier SKU
                            <input
                                name="externalSku"
                                value={productForm.externalSku}
                                onChange={handleProductChange}
                                placeholder="Used for every generated variant row"
                            />
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

                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={productForm.isActive}
                                onChange={handleProductChange}
                            />
                            Active
                        </label>

                        <div className="span-2 stacked-control">
                            <label className="stack-label">Variant Colors</label>

                            <div className="inline-add-row">
                                <input
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addColorChip();
                                        }
                                    }}
                                    placeholder="Type a color and click Add"
                                />
                                <button type="button" onClick={addColorChip}>
                                    Add
                                </button>
                            </div>

                            <div className="chip-list">
                                {productForm.colorOptions.map((color) => (
                                    <div key={color} className="color-chip">
                                        <span>{color}</span>
                                        <button type="button" onClick={() => removeColorChip(color)}>
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="span-2 variants-block stacked-control">
                            <label className="stack-label">Select Sizes</label>

                            <div className="size-checkbox-grid">
                                {SIZE_OPTIONS.map((size) => (
                                    <label key={size} className="size-option-box">
                                        <input
                                            type="checkbox"
                                            checked={productForm.selectedSizes.includes(size)}
                                            onChange={() => toggleSelectedSize(size)}
                                        />
                                        <span>{size}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="span-2 product-images-block stacked-control">
                            <label className="stack-label">Product Images by Color</label>

                            <div className="image-mapping-entry">
                                <select
                                    value={newImageColor}
                                    onChange={(e) => setNewImageColor(e.target.value)}
                                >
                                    <option value="">Select color</option>
                                    {productForm.colorOptions.map((color) => (
                                        <option key={color} value={color}>
                                            {color}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    placeholder="Image URL"
                                />

                                <button type="button" onClick={addProductImageMapping}>
                                    Add Image
                                </button>
                            </div>

                            <div className="image-mapping-list">
                                {productForm.productImages.map((image) => (
                                    <div key={image.id} className="image-mapping-card">
                                        <div className="image-mapping-meta">
                                            <strong>{image.colorName}</strong>
                                            <span>{image.imageUrl}</span>
                                        </div>

                                        <div className="image-mapping-actions">
                                            <button
                                                type="button"
                                                className={image.isPrimary ? "secondary active-primary" : "secondary"}
                                                onClick={() => setPrimaryProductImage(image.id)}
                                            >
                                                {image.isPrimary ? "Primary" : "Set Primary"}
                                            </button>

                                            <button
                                                type="button"
                                                className="secondary"
                                                onClick={() => removeProductImageMapping(image.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="span-2 variants-block stacked-control">
                            <label className="stack-label">Generated Variant Rows</label>

                            <div className="variant-list">
                                {generatedVariantsPreview.length === 0 ? (
                                    <div className="variant-card">
                                        <div className="variant-meta">
                                            <strong>No variants yet</strong>
                                            <span>Add colors and sizes to preview generated rows.</span>
                                        </div>
                                    </div>
                                ) : (
                                    generatedVariantsPreview.map((variant) => (
                                        <div
                                            key={`${variant.colorName}-${variant.sizeName}`}
                                            className="variant-card"
                                        >
                                            <div className="variant-meta">
                                                <strong>{variant.colorName} / {variant.sizeName}</strong>
                                                <span>External SKU: {variant.externalSku || "None"}</span>
                                                <span>Internal SKU: {variant.internalSku}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="button-row span-2">
                            <button type="submit" disabled={saving}>
                                {editingProductId ? "Save Product Row" : "Create Product Rows"}
                            </button>

                            <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                    setEditingProductId(null);
                                    setProductForm(emptyProduct);
                                    setNewImageColor("");
                                    setNewImageUrl("");
                                    setNewColor("");
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
                                <div className="subtle">
                                    Size: {product.sizeOptions || "N/A"} · Color: {product.colorOptions || "N/A"}
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