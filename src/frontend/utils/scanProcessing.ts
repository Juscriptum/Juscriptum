import type { Area } from "react-easy-crop";

const ANALYSIS_MAX_DIMENSION = 960;
const DEFAULT_PADDING_RATIO = 0.018;
const MIN_DOCUMENT_FILL_RATIO = 0.38;
const BACKGROUND_MAP_SIZE = 72;

export const A4_ASPECT_RATIO = 210 / 297;

export type ScanProcessingMode =
  | "color"
  | "document"
  | "black_white"
  | "grayscale"
  | "original";

export type ScanTargetPageFormat =
  | "auto"
  | "original"
  | "a4_portrait"
  | "a4_landscape"
  | "a5"
  | "letter"
  | "legal";

export interface ScanCornerPoint {
  x: number;
  y: number;
}

export interface ScanPageAnalysis {
  suggestedArea: Area;
  suggestedCorners: [
    ScanCornerPoint,
    ScanCornerPoint,
    ScanCornerPoint,
    ScanCornerPoint,
  ];
  fillRatio: number;
  averageBrightness: number;
  borderBrightness: number;
  contrastScore: number;
  hasDarkBorders: boolean;
  hasShadowBias: boolean;
  orientation: "portrait" | "landscape";
  needsEnhancement: boolean;
  skewAngle: number;
  possiblePerspective: boolean;
}

interface PageFormatDefinition {
  key: Exclude<ScanTargetPageFormat, "auto" | "original">;
  width: number;
  height: number;
}

const PAGE_FORMATS: Record<
  Exclude<ScanTargetPageFormat, "auto" | "original">,
  PageFormatDefinition
> = {
  a4_portrait: { key: "a4_portrait", width: 210, height: 297 },
  a4_landscape: { key: "a4_landscape", width: 297, height: 210 },
  a5: { key: "a5", width: 148, height: 210 },
  letter: { key: "letter", width: 216, height: 279 },
  legal: { key: "legal", width: 216, height: 356 },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const roundArea = (area: Area): Area => ({
  x: Math.round(area.x),
  y: Math.round(area.y),
  width: Math.max(1, Math.round(area.width)),
  height: Math.max(1, Math.round(area.height)),
});

export const buildCornersFromArea = (
  area: Area,
): [ScanCornerPoint, ScanCornerPoint, ScanCornerPoint, ScanCornerPoint] => [
  { x: area.x, y: area.y },
  { x: area.x + area.width, y: area.y },
  { x: area.x + area.width, y: area.y + area.height },
  { x: area.x, y: area.y + area.height },
];

export const getBoundingAreaFromCorners = (
  corners: ScanCornerPoint[],
  sourceWidth: number,
  sourceHeight: number,
): Area => {
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const x = clamp(Math.min(...xs), 0, sourceWidth - 1);
  const y = clamp(Math.min(...ys), 0, sourceHeight - 1);
  const right = clamp(Math.max(...xs), x + 1, sourceWidth);
  const bottom = clamp(Math.max(...ys), y + 1, sourceHeight);

  return roundArea({
    x,
    y,
    width: right - x,
    height: bottom - y,
  });
};

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Не вдалося підготувати сторінку"));
      },
      type,
      quality,
    );
  });

export const loadImageFromSrc = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Не вдалося підготувати зображення скану"));
    image.src = src;
  });

const getSourceSize = (source: CanvasImageSource) => {
  if (source instanceof HTMLImageElement) {
    return {
      width: source.naturalWidth || source.width,
      height: source.naturalHeight || source.height,
    };
  }

  if (source instanceof HTMLCanvasElement) {
    return {
      width: source.width,
      height: source.height,
    };
  }

  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return {
      width: source.width,
      height: source.height,
    };
  }

  return {
    width: (source as { width: number }).width,
    height: (source as { height: number }).height,
  };
};

const buildCenteredArea = (
  sourceWidth: number,
  sourceHeight: number,
  aspect?: number,
): Area => {
  const insetX = Math.round(sourceWidth * 0.06);
  const insetY = Math.round(sourceHeight * 0.04);
  const area: Area = {
    x: insetX,
    y: insetY,
    width: sourceWidth - insetX * 2,
    height: sourceHeight - insetY * 2,
  };

  if (!aspect) {
    return roundArea(area);
  }

  return fitAreaToAspect(area, sourceWidth, sourceHeight, aspect);
};

export const getSuggestedDocumentArea = (
  sourceWidth: number,
  sourceHeight: number,
  detectedArea?: Area | null,
  aspect?: number,
): Area => {
  if (!detectedArea) {
    return buildCenteredArea(sourceWidth, sourceHeight, aspect);
  }

  if (!aspect) {
    return roundArea(detectedArea);
  }

  return fitAreaToAspect(detectedArea, sourceWidth, sourceHeight, aspect);
};

const smoothSignal = (values: number[], radius = 4): number[] =>
  values.map((_, index) => {
    let total = 0;
    let count = 0;

    for (
      let signalIndex = Math.max(0, index - radius);
      signalIndex <= Math.min(values.length - 1, index + radius);
      signalIndex += 1
    ) {
      total += values[signalIndex];
      count += 1;
    }

    return count > 0 ? total / count : values[index];
  });

const findDenseEdge = (
  values: number[],
  minimumDensity: number,
  fromStart: boolean,
): number => {
  const lastIndex = values.length - 1;

  if (fromStart) {
    for (let index = 0; index <= lastIndex; index += 1) {
      if (values[index] >= minimumDensity) {
        return index;
      }
    }

    return 0;
  }

  for (let index = lastIndex; index >= 0; index -= 1) {
    if (values[index] >= minimumDensity) {
      return index;
    }
  }

  return lastIndex;
};

const padArea = (
  area: Area,
  sourceWidth: number,
  sourceHeight: number,
  paddingRatio = DEFAULT_PADDING_RATIO,
): Area => {
  const paddingX = Math.max(8, Math.round(sourceWidth * paddingRatio));
  const paddingY = Math.max(8, Math.round(sourceHeight * paddingRatio));

  const x = clamp(area.x - paddingX, 0, Math.max(0, sourceWidth - 1));
  const y = clamp(area.y - paddingY, 0, Math.max(0, sourceHeight - 1));
  const right = clamp(
    area.x + area.width + paddingX,
    x + 1,
    Math.max(1, sourceWidth),
  );
  const bottom = clamp(
    area.y + area.height + paddingY,
    y + 1,
    Math.max(1, sourceHeight),
  );

  return roundArea({
    x,
    y,
    width: right - x,
    height: bottom - y,
  });
};

export const fitAreaToAspect = (
  area: Area,
  sourceWidth: number,
  sourceHeight: number,
  aspect: number,
): Area => {
  if (!aspect || aspect <= 0) {
    return roundArea(area);
  }

  let width = area.width;
  let height = area.height;
  const currentAspect = width / height;

  if (currentAspect > aspect) {
    height = Math.min(sourceHeight, width / aspect);
  } else {
    width = Math.min(sourceWidth, height * aspect);
  }

  let x = area.x - (width - area.width) / 2;
  let y = area.y - (height - area.height) / 2;

  x = clamp(x, 0, Math.max(0, sourceWidth - width));
  y = clamp(y, 0, Math.max(0, sourceHeight - height));

  return roundArea({
    x,
    y,
    width,
    height,
  });
};

export const detectDocumentArea = (
  source: CanvasImageSource,
  aspect?: number,
): Area => {
  const { width: sourceWidth, height: sourceHeight } = getSourceSize(source);

  if (!sourceWidth || !sourceHeight) {
    return buildCenteredArea(1200, 1600, aspect);
  }

  const scale =
    Math.max(sourceWidth, sourceHeight) > ANALYSIS_MAX_DIMENSION
      ? ANALYSIS_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight)
      : 1;

  const analysisWidth = Math.max(1, Math.round(sourceWidth * scale));
  const analysisHeight = Math.max(1, Math.round(sourceHeight * scale));
  const analysisCanvas = createCanvas(analysisWidth, analysisHeight);
  const analysisContext = analysisCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!analysisContext) {
    return buildCenteredArea(sourceWidth, sourceHeight, aspect);
  }

  analysisContext.drawImage(source, 0, 0, analysisWidth, analysisHeight);

  const { data } = analysisContext.getImageData(
    0,
    0,
    analysisWidth,
    analysisHeight,
  );

  const borderThickness = Math.max(
    4,
    Math.round(Math.min(analysisWidth, analysisHeight) * 0.06),
  );
  const rowDensity = new Array(analysisHeight).fill(0);
  const columnDensity = new Array(analysisWidth).fill(0);
  let borderBrightnessTotal = 0;
  let borderPixels = 0;
  let globalBrightnessTotal = 0;

  for (let y = 0; y < analysisHeight; y += 1) {
    for (let x = 0; x < analysisWidth; x += 1) {
      const offset = (y * analysisWidth + x) * 4;
      const brightness =
        data[offset] * 0.299 +
        data[offset + 1] * 0.587 +
        data[offset + 2] * 0.114;

      globalBrightnessTotal += brightness;

      if (
        x < borderThickness ||
        y < borderThickness ||
        x >= analysisWidth - borderThickness ||
        y >= analysisHeight - borderThickness
      ) {
        borderBrightnessTotal += brightness;
        borderPixels += 1;
      }
    }
  }

  const borderBrightness =
    borderPixels > 0 ? borderBrightnessTotal / borderPixels : 200;
  const globalBrightness =
    globalBrightnessTotal / (analysisWidth * analysisHeight);
  const documentIsLighter = globalBrightness >= borderBrightness;
  const contrast = Math.abs(globalBrightness - borderBrightness);
  const threshold = documentIsLighter
    ? clamp(borderBrightness + Math.max(14, contrast * 0.45), 110, 245)
    : clamp(borderBrightness - Math.max(14, contrast * 0.45), 10, 160);

  for (let y = 0; y < analysisHeight; y += 1) {
    for (let x = 0; x < analysisWidth; x += 1) {
      const offset = (y * analysisWidth + x) * 4;
      const brightness =
        data[offset] * 0.299 +
        data[offset + 1] * 0.587 +
        data[offset + 2] * 0.114;
      const isDocumentPixel = documentIsLighter
        ? brightness >= threshold
        : brightness <= threshold;

      if (isDocumentPixel) {
        rowDensity[y] += 1;
        columnDensity[x] += 1;
      }
    }
  }

  const smoothedRows = smoothSignal(
    rowDensity.map((value) => value / analysisWidth),
  );
  const smoothedColumns = smoothSignal(
    columnDensity.map((value) => value / analysisHeight),
  );

  const minimumRowDensity = documentIsLighter ? 0.46 : 0.34;
  const minimumColumnDensity = documentIsLighter ? 0.42 : 0.32;
  const top = findDenseEdge(smoothedRows, minimumRowDensity, true);
  const bottom = findDenseEdge(smoothedRows, minimumRowDensity, false);
  const left = findDenseEdge(smoothedColumns, minimumColumnDensity, true);
  const right = findDenseEdge(smoothedColumns, minimumColumnDensity, false);

  const detectedWidth = Math.max(1, right - left + 1);
  const detectedHeight = Math.max(1, bottom - top + 1);

  if (
    detectedWidth / analysisWidth < MIN_DOCUMENT_FILL_RATIO ||
    detectedHeight / analysisHeight < MIN_DOCUMENT_FILL_RATIO
  ) {
    return buildCenteredArea(sourceWidth, sourceHeight, aspect);
  }

  const rawArea: Area = {
    x: Math.round(left / scale),
    y: Math.round(top / scale),
    width: Math.round(detectedWidth / scale),
    height: Math.round(detectedHeight / scale),
  };

  const paddedArea = padArea(rawArea, sourceWidth, sourceHeight);

  if (!aspect) {
    return paddedArea;
  }

  return fitAreaToAspect(paddedArea, sourceWidth, sourceHeight, aspect);
};

export const analyzeScanPage = (
  source: CanvasImageSource,
): ScanPageAnalysis => {
  const { width, height } = getSourceSize(source);
  const suggestedArea = detectDocumentArea(source);
  const suggestedCorners = buildCornersFromArea(suggestedArea);
  const analysisCanvas = createCanvas(
    Math.max(1, Math.min(width, ANALYSIS_MAX_DIMENSION)),
    Math.max(1, Math.min(height, ANALYSIS_MAX_DIMENSION)),
  );
  const context = analysisCanvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return {
      suggestedArea,
      suggestedCorners,
      fillRatio: 1,
      averageBrightness: 210,
      borderBrightness: 210,
      contrastScore: 0,
      hasDarkBorders: false,
      hasShadowBias: false,
      orientation: width > height ? "landscape" : "portrait",
      needsEnhancement: false,
      skewAngle: 0,
      possiblePerspective: false,
    };
  }

  context.drawImage(source, 0, 0, analysisCanvas.width, analysisCanvas.height);
  const { data } = context.getImageData(
    0,
    0,
    analysisCanvas.width,
    analysisCanvas.height,
  );

  let brightnessTotal = 0;
  let borderBrightnessTotal = 0;
  let shadowLeft = 0;
  let shadowRight = 0;
  let contrastScore = 0;
  let borderPixels = 0;
  const borderSize = Math.max(
    4,
    Math.round(Math.min(analysisCanvas.width, analysisCanvas.height) * 0.05),
  );

  for (let y = 0; y < analysisCanvas.height; y += 1) {
    for (let x = 0; x < analysisCanvas.width; x += 1) {
      const offset = (y * analysisCanvas.width + x) * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const brightness = red * 0.299 + green * 0.587 + blue * 0.114;
      const localContrast =
        Math.max(red, green, blue) - Math.min(red, green, blue);

      brightnessTotal += brightness;
      contrastScore += localContrast;

      if (
        x < borderSize ||
        y < borderSize ||
        x >= analysisCanvas.width - borderSize ||
        y >= analysisCanvas.height - borderSize
      ) {
        borderBrightnessTotal += brightness;
        borderPixels += 1;
      }

      if (x < analysisCanvas.width / 2) {
        shadowLeft += brightness;
      } else {
        shadowRight += brightness;
      }
    }
  }

  const totalPixels = analysisCanvas.width * analysisCanvas.height;
  const averageBrightness = brightnessTotal / totalPixels;
  const borderBrightness =
    borderPixels > 0 ? borderBrightnessTotal / borderPixels : averageBrightness;
  const averageContrast = contrastScore / totalPixels;
  const fillRatio =
    (suggestedArea.width * suggestedArea.height) / Math.max(1, width * height);
  const leftAverage =
    shadowLeft /
    Math.max(1, analysisCanvas.width * analysisCanvas.height * 0.5);
  const rightAverage =
    shadowRight /
    Math.max(1, analysisCanvas.width * analysisCanvas.height * 0.5);
  const hasShadowBias = Math.abs(leftAverage - rightAverage) > 18;
  const hasDarkBorders = borderBrightness < averageBrightness - 10;
  const topWidth = suggestedCorners[1].x - suggestedCorners[0].x;
  const bottomWidth = suggestedCorners[2].x - suggestedCorners[3].x;
  const leftHeight = suggestedCorners[3].y - suggestedCorners[0].y;
  const rightHeight = suggestedCorners[2].y - suggestedCorners[1].y;
  const skewAngle =
    Math.atan2(
      suggestedCorners[1].y - suggestedCorners[0].y,
      Math.max(1, suggestedCorners[1].x - suggestedCorners[0].x),
    ) *
    (180 / Math.PI);
  const possiblePerspective =
    Math.abs(topWidth - bottomWidth) >
      Math.max(12, suggestedArea.width * 0.06) ||
    Math.abs(leftHeight - rightHeight) >
      Math.max(12, suggestedArea.height * 0.06);

  return {
    suggestedArea,
    suggestedCorners,
    fillRatio,
    averageBrightness,
    borderBrightness,
    contrastScore: averageContrast,
    hasDarkBorders,
    hasShadowBias,
    orientation: width > height ? "landscape" : "portrait",
    needsEnhancement:
      averageContrast < 26 ||
      averageBrightness < 190 ||
      hasDarkBorders ||
      hasShadowBias,
    skewAngle,
    possiblePerspective,
  };
};

const getRadianAngle = (degrees: number) => (degrees * Math.PI) / 180;

const distanceBetween = (a: ScanCornerPoint, b: ScanCornerPoint) =>
  Math.hypot(b.x - a.x, b.y - a.y);

const interpolatePoint = (
  start: ScanCornerPoint,
  end: ScanCornerPoint,
  ratio: number,
): ScanCornerPoint => ({
  x: start.x + (end.x - start.x) * ratio,
  y: start.y + (end.y - start.y) * ratio,
});

const sampleChannel = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number,
) => {
  const clampedX = clamp(x, 0, Math.max(0, width - 1));
  const clampedY = clamp(y, 0, Math.max(0, height - 1));
  const x0 = Math.floor(clampedX);
  const y0 = Math.floor(clampedY);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const dx = clampedX - x0;
  const dy = clampedY - y0;

  const offset00 = (y0 * width + x0) * 4 + channel;
  const offset10 = (y0 * width + x1) * 4 + channel;
  const offset01 = (y1 * width + x0) * 4 + channel;
  const offset11 = (y1 * width + x1) * 4 + channel;

  const top = data[offset00] * (1 - dx) + data[offset10] * dx;
  const bottom = data[offset01] * (1 - dx) + data[offset11] * dx;
  return top * (1 - dy) + bottom * dy;
};

const warpPerspectiveFromCorners = (
  sourceCanvas: HTMLCanvasElement,
  corners: [ScanCornerPoint, ScanCornerPoint, ScanCornerPoint, ScanCornerPoint],
  backgroundColor: string,
) => {
  const targetWidth = Math.max(
    1,
    Math.round(
      Math.max(
        distanceBetween(corners[0], corners[1]),
        distanceBetween(corners[3], corners[2]),
      ),
    ),
  );
  const targetHeight = Math.max(
    1,
    Math.round(
      Math.max(
        distanceBetween(corners[0], corners[3]),
        distanceBetween(corners[1], corners[2]),
      ),
    ),
  );
  const sourceContext = sourceCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  const targetCanvas = createCanvas(targetWidth, targetHeight);
  const targetContext = targetCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!sourceContext || !targetContext) {
    return sourceCanvas;
  }

  const sourceImageData = sourceContext.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  );
  const targetImageData = targetContext.createImageData(
    targetWidth,
    targetHeight,
  );
  const fallbackRgb =
    backgroundColor === "#ffffff" ? [255, 255, 255] : [245, 245, 245];

  for (let y = 0; y < targetHeight; y += 1) {
    const v = targetHeight <= 1 ? 0 : y / (targetHeight - 1);
    const left = interpolatePoint(corners[0], corners[3], v);
    const right = interpolatePoint(corners[1], corners[2], v);

    for (let x = 0; x < targetWidth; x += 1) {
      const u = targetWidth <= 1 ? 0 : x / (targetWidth - 1);
      const sourcePoint = interpolatePoint(left, right, u);
      const offset = (y * targetWidth + x) * 4;

      if (
        sourcePoint.x < 0 ||
        sourcePoint.y < 0 ||
        sourcePoint.x >= sourceCanvas.width ||
        sourcePoint.y >= sourceCanvas.height
      ) {
        targetImageData.data[offset] = fallbackRgb[0];
        targetImageData.data[offset + 1] = fallbackRgb[1];
        targetImageData.data[offset + 2] = fallbackRgb[2];
        targetImageData.data[offset + 3] = 255;
        continue;
      }

      targetImageData.data[offset] = sampleChannel(
        sourceImageData.data,
        sourceCanvas.width,
        sourceCanvas.height,
        sourcePoint.x,
        sourcePoint.y,
        0,
      );
      targetImageData.data[offset + 1] = sampleChannel(
        sourceImageData.data,
        sourceCanvas.width,
        sourceCanvas.height,
        sourcePoint.x,
        sourcePoint.y,
        1,
      );
      targetImageData.data[offset + 2] = sampleChannel(
        sourceImageData.data,
        sourceCanvas.width,
        sourceCanvas.height,
        sourcePoint.x,
        sourcePoint.y,
        2,
      );
      targetImageData.data[offset + 3] = 255;
    }
  }

  targetContext.putImageData(targetImageData, 0, 0);
  return targetCanvas;
};

const rotateSize = (width: number, height: number, rotation: number) => ({
  width:
    Math.abs(Math.cos(getRadianAngle(rotation)) * width) +
    Math.abs(Math.sin(getRadianAngle(rotation)) * height),
  height:
    Math.abs(Math.sin(getRadianAngle(rotation)) * width) +
    Math.abs(Math.cos(getRadianAngle(rotation)) * height),
});

const getTargetFormatDefinition = (
  pageFormat: ScanTargetPageFormat,
  orientation: "portrait" | "landscape",
): PageFormatDefinition | null => {
  if (pageFormat === "auto") {
    return orientation === "landscape"
      ? PAGE_FORMATS.a4_landscape
      : PAGE_FORMATS.a4_portrait;
  }

  if (pageFormat === "original") {
    return null;
  }

  return PAGE_FORMATS[pageFormat];
};

export const getPageFormatAspectRatio = (
  pageFormat: ScanTargetPageFormat,
  fallbackAspect?: number,
): number | undefined => {
  if (pageFormat === "original") {
    return fallbackAspect;
  }

  const formatDefinition = getTargetFormatDefinition(pageFormat, "portrait");
  if (!formatDefinition) {
    return fallbackAspect;
  }

  return formatDefinition.width / formatDefinition.height;
};

const buildBackgroundMap = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const backgroundCanvas = createCanvas(
    BACKGROUND_MAP_SIZE,
    BACKGROUND_MAP_SIZE,
  );
  const context = backgroundCanvas.getContext("2d");

  if (!context) {
    return source;
  }

  context.filter = "blur(8px)";
  context.drawImage(source, 0, 0, BACKGROUND_MAP_SIZE, BACKGROUND_MAP_SIZE);
  context.filter = "none";

  const upscaledCanvas = createCanvas(source.width, source.height);
  const upscaledContext = upscaledCanvas.getContext("2d");

  if (!upscaledContext) {
    return source;
  }

  upscaledContext.imageSmoothingEnabled = true;
  upscaledContext.drawImage(
    backgroundCanvas,
    0,
    0,
    BACKGROUND_MAP_SIZE,
    BACKGROUND_MAP_SIZE,
    0,
    0,
    source.width,
    source.height,
  );

  return upscaledCanvas;
};

const computeOtsuThreshold = (histogram: number[], totalPixels: number) => {
  let sum = 0;
  for (let index = 0; index < histogram.length; index += 1) {
    sum += index * histogram[index];
  }

  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 127;

  for (let index = 0; index < histogram.length; index += 1) {
    weightBackground += histogram[index];
    if (weightBackground === 0) {
      continue;
    }

    const weightForeground = totalPixels - weightBackground;
    if (weightForeground === 0) {
      break;
    }

    sumBackground += index * histogram[index];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) *
      (meanBackground - meanForeground);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = index;
    }
  }

  return threshold;
};

const applyProcessingMode = (
  sourceCanvas: HTMLCanvasElement,
  mode: ScanProcessingMode,
): HTMLCanvasElement => {
  if (mode === "original") {
    return sourceCanvas;
  }

  const outputCanvas = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const outputContext = outputCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  const sourceContext = sourceCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!outputContext || !sourceContext) {
    return sourceCanvas;
  }

  outputContext.drawImage(sourceCanvas, 0, 0);

  const imageData = outputContext.getImageData(
    0,
    0,
    outputCanvas.width,
    outputCanvas.height,
  );
  const backgroundCanvas = buildBackgroundMap(sourceCanvas);
  const backgroundContext = backgroundCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  const backgroundData = backgroundContext
    ? backgroundContext.getImageData(
        0,
        0,
        outputCanvas.width,
        outputCanvas.height,
      ).data
    : null;
  const histogram = new Array<number>(256).fill(0);

  for (let offset = 0; offset < imageData.data.length; offset += 4) {
    const red = imageData.data[offset];
    const green = imageData.data[offset + 1];
    const blue = imageData.data[offset + 2];
    const brightness = red * 0.299 + green * 0.587 + blue * 0.114;
    const backgroundBrightness = backgroundData
      ? backgroundData[offset] * 0.299 +
        backgroundData[offset + 1] * 0.587 +
        backgroundData[offset + 2] * 0.114
      : brightness;

    const normalizedBrightness = clamp(
      brightness + Math.max(0, 220 - backgroundBrightness) * 0.9,
      0,
      255,
    );
    histogram[Math.round(normalizedBrightness)] += 1;

    if (mode === "color") {
      const lift = clamp((235 - backgroundBrightness) / 255, 0, 0.3);
      imageData.data[offset] = clamp(red + (255 - red) * lift, 0, 255);
      imageData.data[offset + 1] = clamp(green + (255 - green) * lift, 0, 255);
      imageData.data[offset + 2] = clamp(blue + (255 - blue) * lift, 0, 255);
      continue;
    }

    imageData.data[offset] = normalizedBrightness;
    imageData.data[offset + 1] = normalizedBrightness;
    imageData.data[offset + 2] = normalizedBrightness;
  }

  if (mode === "grayscale") {
    outputContext.putImageData(imageData, 0, 0);
    return outputCanvas;
  }

  const threshold = computeOtsuThreshold(
    histogram,
    outputCanvas.width * outputCanvas.height,
  );

  for (let offset = 0; offset < imageData.data.length; offset += 4) {
    const brightness = imageData.data[offset];

    if (mode === "document") {
      const contrasted =
        brightness < threshold
          ? clamp(brightness * 0.52, 0, 255)
          : clamp(255 - (255 - brightness) * 0.25, 0, 255);
      imageData.data[offset] = contrasted;
      imageData.data[offset + 1] = contrasted;
      imageData.data[offset + 2] = contrasted;
      continue;
    }

    const binary = brightness < threshold + 8 ? 0 : 255;
    imageData.data[offset] = binary;
    imageData.data[offset + 1] = binary;
    imageData.data[offset + 2] = binary;
  }

  outputContext.putImageData(imageData, 0, 0);
  return outputCanvas;
};

const fitCanvasToPageFormat = (
  sourceCanvas: HTMLCanvasElement,
  pageFormat: ScanTargetPageFormat,
  backgroundColor: string,
): HTMLCanvasElement => {
  if (pageFormat === "original") {
    return sourceCanvas;
  }

  const orientation =
    sourceCanvas.width > sourceCanvas.height ? "landscape" : "portrait";
  const formatDefinition = getTargetFormatDefinition(pageFormat, orientation);

  if (!formatDefinition) {
    return sourceCanvas;
  }

  const targetHeight = 1800;
  const targetWidth = Math.round(
    targetHeight * (formatDefinition.width / formatDefinition.height),
  );
  const canvas = createCanvas(targetWidth, targetHeight);
  const context = canvas.getContext("2d");

  if (!context) {
    return sourceCanvas;
  }

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, targetWidth, targetHeight);

  const scale = Math.min(
    targetWidth / sourceCanvas.width,
    targetHeight / sourceCanvas.height,
  );
  const width = Math.round(sourceCanvas.width * scale);
  const height = Math.round(sourceCanvas.height * scale);
  const x = Math.round((targetWidth - width) / 2);
  const y = Math.round((targetHeight - height) / 2);

  context.drawImage(sourceCanvas, x, y, width, height);

  return canvas;
};

export const renderProcessedScanCanvas = async (options: {
  imageSrc: string;
  crop: Area;
  corners?: [
    ScanCornerPoint,
    ScanCornerPoint,
    ScanCornerPoint,
    ScanCornerPoint,
  ];
  rotation?: number;
  alignToA4?: boolean;
  backgroundColor?: string;
  processingMode?: ScanProcessingMode;
  pageFormat?: ScanTargetPageFormat;
}): Promise<HTMLCanvasElement> => {
  const {
    imageSrc,
    crop,
    corners,
    rotation = 0,
    alignToA4 = true,
    backgroundColor = "#ffffff",
    processingMode = "document",
    pageFormat,
  } = options;
  const image = await loadImageFromSrc(imageSrc);
  const rotatedSize = rotateSize(image.width, image.height, rotation);
  const workingCanvas = createCanvas(
    Math.max(1, Math.round(rotatedSize.width)),
    Math.max(1, Math.round(rotatedSize.height)),
  );
  const workingContext = workingCanvas.getContext("2d");

  if (!workingContext) {
    throw new Error("Не вдалося підготувати сторінку скану");
  }

  workingContext.fillStyle = backgroundColor;
  workingContext.fillRect(0, 0, workingCanvas.width, workingCanvas.height);
  workingContext.translate(workingCanvas.width / 2, workingCanvas.height / 2);
  workingContext.rotate(getRadianAngle(rotation));
  workingContext.drawImage(image, -image.width / 2, -image.height / 2);

  let normalizedCanvas: HTMLCanvasElement;

  if (corners) {
    normalizedCanvas = warpPerspectiveFromCorners(
      workingCanvas,
      corners,
      backgroundColor,
    );
  } else {
    const targetCrop = roundArea(crop);
    const cropCanvas = createCanvas(targetCrop.width, targetCrop.height);
    const cropContext = cropCanvas.getContext("2d");

    if (!cropContext) {
      throw new Error("Не вдалося обрізати сторінку скану");
    }

    cropContext.fillStyle = backgroundColor;
    cropContext.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    cropContext.drawImage(
      workingCanvas,
      targetCrop.x,
      targetCrop.y,
      targetCrop.width,
      targetCrop.height,
      0,
      0,
      targetCrop.width,
      targetCrop.height,
    );
    normalizedCanvas = cropCanvas;
  }

  const enhancedCanvas = applyProcessingMode(normalizedCanvas, processingMode);
  const targetFormat = pageFormat || (alignToA4 ? "a4_portrait" : "original");

  return fitCanvasToPageFormat(enhancedCanvas, targetFormat, backgroundColor);
};
