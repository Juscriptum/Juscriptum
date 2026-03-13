const DEFAULT_MAX_SIZE_BYTES = 9 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 2400;
const MIN_QUALITY = 0.45;
const QUALITY_STEP = 0.08;
const RESIZE_STEP = 0.85;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не вдалося обробити зображення"));
    };

    image.src = objectUrl;
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Не вдалося стиснути зображення"));
      },
      "image/jpeg",
      quality,
    );
  });

const drawToCanvas = (
  image: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas недоступний");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas;
};

const getScaledDimensions = (
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } => {
  const longestSide = Math.max(width, height);

  if (longestSide <= maxDimension) {
    return { width, height };
  }

  const ratio = maxDimension / longestSide;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const renameAsJpeg = (name: string): string => {
  const normalized = name.replace(/\.[^.]+$/, "") || "scan";
  return `${normalized}.jpg`;
};

export const prepareImageForScanUpload = async (
  file: File,
  options?: {
    maxSizeBytes?: number;
    maxDimension?: number;
  },
): Promise<File> => {
  const maxSizeBytes = options?.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;
  const maxDimension = options?.maxDimension || DEFAULT_MAX_DIMENSION;

  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (
    file.size <= maxSizeBytes &&
    ["image/jpeg", "image/jpg", "image/png"].includes(file.type)
  ) {
    return file;
  }

  const image = await loadImage(file);
  let { width, height } = getScaledDimensions(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxDimension,
  );
  let canvas = drawToCanvas(image, width, height);
  let quality = 0.9;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > maxSizeBytes && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    blob = await canvasToBlob(canvas, quality);
  }

  while (blob.size > maxSizeBytes && Math.max(width, height) > 1280) {
    width = Math.max(1, Math.round(width * RESIZE_STEP));
    height = Math.max(1, Math.round(height * RESIZE_STEP));
    canvas = drawToCanvas(image, width, height);
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > maxSizeBytes) {
    throw new Error(
      "Фото не вдалося стиснути до 10 МБ. Зменште роздільну здатність камери або обріжте кадр.",
    );
  }

  return new File([blob], renameAsJpeg(file.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
};
