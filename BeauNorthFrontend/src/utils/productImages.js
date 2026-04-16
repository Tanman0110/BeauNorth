export function getPrimaryProductImage(product, selectedColor = null) {
    const images = Array.isArray(product?.productImages) ? product.productImages : [];

    if (!images.length) {
        return "";
    }

    if (selectedColor) {
        const normalizedColor = selectedColor.toLowerCase();

        const colorPrimary = images.find(
            (image) =>
                image.colorName?.toLowerCase() === normalizedColor &&
                image.isPrimary
        );

        if (colorPrimary?.imageUrl) {
            return colorPrimary.imageUrl;
        }

        const colorMatch = images.find(
            (image) => image.colorName?.toLowerCase() === normalizedColor
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
    const images = Array.isArray(product?.productImages) ? product.productImages : [];

    if (!colorName) {
        return images;
    }

    return images.filter(
        (image) => image.colorName?.toLowerCase() === colorName.toLowerCase()
    );
}

export function getAvailableImageColors(product) {
    const images = Array.isArray(product?.productImages) ? product.productImages : [];

    return [...new Set(images.map((image) => image.colorName).filter(Boolean))];
}