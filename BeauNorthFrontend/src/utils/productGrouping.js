export function normalizeOptionValue(value) {
    return String(value || "").trim();
}

export function buildProductGroupKey(product) {
    return [
        product.categoryId ?? "",
        normalizeOptionValue(product.name).toLowerCase(),
        normalizeOptionValue(product.shortDescription).toLowerCase(),
        normalizeOptionValue(product.longDescriptionHtml).toLowerCase(),
        Number(product.price ?? 0),
        normalizeOptionValue(product.audience).toLowerCase(),
        normalizeOptionValue(product.fulfillmentProvider).toLowerCase(),
        Boolean(product.isActive)
    ].join("|");
}

function mergeImages(products) {
    const seen = new Set();
    const merged = [];

    for (const product of products) {
        for (const image of product.productImages || []) {
            const key = `${normalizeOptionValue(image.colorName).toLowerCase()}|${normalizeOptionValue(image.imageUrl)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(image);
        }
    }

    return merged;
}

export function groupProductsForDisplay(products) {
    const groups = new Map();

    for (const product of products || []) {
        const key = buildProductGroupKey(product);

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key).push(product);
    }

    return Array.from(groups.values()).map((groupProducts) => {
        const representative = groupProducts[0];

        const availableColors = [
            ...new Set(
                groupProducts
                    .map((product) => normalizeOptionValue(product.colorOptions))
                    .filter(Boolean)
            )
        ];

        const availableSizes = [
            ...new Set(
                groupProducts
                    .map((product) => normalizeOptionValue(product.sizeOptions))
                    .filter(Boolean)
            )
        ];

        return {
            ...representative,
            productId: representative.productId,
            variantProducts: groupProducts,
            availableColors,
            availableSizes,
            productImages: mergeImages(groupProducts)
        };
    });
}

export function findGroupedSiblings(allProducts, referenceProduct) {
    if (!referenceProduct) {
        return [];
    }

    const key = buildProductGroupKey(referenceProduct);

    return (allProducts || []).filter(
        (product) => buildProductGroupKey(product) === key
    );
}

export function findVariantForSelection(variants, color, size) {
    const normalizedColor = normalizeOptionValue(color).toLowerCase();
    const normalizedSize = normalizeOptionValue(size).toLowerCase();

    return (
        variants.find((variant) =>
            normalizeOptionValue(variant.colorOptions).toLowerCase() === normalizedColor &&
            normalizeOptionValue(variant.sizeOptions).toLowerCase() === normalizedSize
        ) ||
        variants.find((variant) =>
            normalizeOptionValue(variant.colorOptions).toLowerCase() === normalizedColor
        ) ||
        variants.find((variant) =>
            normalizeOptionValue(variant.sizeOptions).toLowerCase() === normalizedSize
        ) ||
        variants[0] ||
        null
    );
}