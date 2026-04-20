import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/** TCS division hero images: mx, da, vd (AV) — synced from /public via admin. */
export const TCS_ALL_PRODUCTS_IMAGES_FOLDER = 'tcs/all-products-images';

/**
 * Uploads MX, DA, and VD/AV product images from the app’s public assets to Firebase Storage.
 * Paths: tcs/all-products-images/mx.png, da.png, vd.png
 * @returns {Promise<Record<string, string>>} map storage filename → download URL
 */
export const uploadTcsAllProductImagesFromPublic = async () => {
    const assets = [
        { publicPath: '/mx_logo.png', storageName: 'mx.png' },
        { publicPath: '/ce_logo.png', storageName: 'da.png' },
        { publicPath: '/av_division.png', storageName: 'vd.png' },
    ];
    const urls = {};
    for (const { publicPath, storageName } of assets) {
        const res = await fetch(publicPath);
        if (!res.ok) throw new Error(`Could not load ${publicPath}`);
        const blob = await res.blob();
        const storageRef = ref(storage, `${TCS_ALL_PRODUCTS_IMAGES_FOLDER}/${storageName}`);
        await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/png' });
        urls[storageName] = await getDownloadURL(storageRef);
    }
    return urls;
};

export const uploadPhoto = async (file, path = 'engineers', customName = null, options = {}) => {
    if (!file) return null;

    const { stableFileName = false } = options;
    const timestamp = Date.now();
    const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const extension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
    const safeBase = customName ? String(customName).replace(/[^\w.-]/g, '') : '';
    const fileName = customName
        ? (stableFileName ? `${safeBase}.${extension}` : `${safeBase}_${timestamp}.${extension}`)
        : `${timestamp}_${String(file.name).replace(/[^\w.-]/g, '_')}`;

    const storageRef = ref(storage, `${path}/${fileName}`);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
};
