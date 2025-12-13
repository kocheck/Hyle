export type AssetType = 'MAP' | 'TOKEN';

const MAX_MAP_DIMENSION = 4096;
const MAX_TOKEN_DIMENSION = 512;

export const processImage = async (file: File, type: AssetType): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  const maxDim = type === 'MAP' ? MAX_MAP_DIMENSION : MAX_TOKEN_DIMENSION;

  let width = bitmap.width;
  let height = bitmap.height;

  // Calculate new dimensions
  if (width > maxDim || height > maxDim) {
    const ratio = width / height;
    if (width > height) {
      width = maxDim;
      height = Math.round(maxDim / ratio);
    } else {
      height = maxDim;
      width = Math.round(maxDim * ratio);
    }
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get 2D context from OffscreenCanvas');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);

  // Clean up bitmap
  bitmap.close();

  const blob = await canvas.convertToBlob({
    type: 'image/webp',
    quality: 0.85,
  });

  const buffer = await blob.arrayBuffer();
  // @ts-ignore
  const filePath = await window.ipcRenderer.invoke('SAVE_ASSET_TEMP', buffer, file.name.replace(/\.[^/.]+$/, "") + ".webp");

  return filePath as string;
};
