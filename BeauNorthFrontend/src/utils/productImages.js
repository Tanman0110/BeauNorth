function normalizeColor(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizeImages(product) {
    return Array.isArray(product?.productImages)
        ? product.productImages.filter((image) => image?.imageUrl)
        : [];
}

export function getPrimaryProductImage(product, selectedColor = null) {
    const images = normalizeImages(product);

    if (!images.length) {
        return "";
    }

    const normalizedSelectedColor = normalizeColor(selectedColor);

    if (normalizedSelectedColor) {
        const colorPrimary = images.find(
            (image) =>
                normalizeColor(image.colorName) === normalizedSelectedColor &&
                image.isPrimary
        );

        if (colorPrimary?.imageUrl) {
            return colorPrimary.imageUrl;
        }

        const colorMatch = images.find(
            (image) => normalizeColor(image.colorName) === normalizedSelectedColor
        );

        if (colorMatch?.imageUrl) {
            return colorMatch.imageUrl;
        }
    }

    const primaryImage = images.find((image) => image.isPrimary);
    if (primaryImage?.imageUrl) {
        return primaryImage.imageUrl;
    }

    return images[0]?.imageUrl || "";
}

export function getImagesForColor(product, colorName) {
    const images = normalizeImages(product);
    const normalizedColor = normalizeColor(colorName);

    if (!normalizedColor) {
        return images;
    }

    return images.filter(
        (image) => normalizeColor(image.colorName) === normalizedColor
    );
}

export function getAvailableImageColors(product) {
    const images = normalizeImages(product);

    return [
        ...new Set(
            images
                .map((image) => String(image.colorName || "").trim())
                .filter(Boolean)
        )
    ];
}