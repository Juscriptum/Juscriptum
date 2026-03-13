#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import tempfile
from pathlib import Path


def command_exists(name: str) -> bool:
    return shutil.which(name) is not None


def bool_flag(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def order_points(points):
    import numpy as np

    rect = np.zeros((4, 2), dtype="float32")
    sums = points.sum(axis=1)
    rect[0] = points[sums.argmin()]
    rect[2] = points[sums.argmax()]

    diffs = np.diff(points, axis=1)
    rect[1] = points[diffs.argmin()]
    rect[3] = points[diffs.argmax()]
    return rect


def four_point_transform(image, points):
    import cv2  # type: ignore
    import numpy as np

    rect = order_points(points)
    (tl, tr, br, bl) = rect

    width_a = np.linalg.norm(br - bl)
    width_b = np.linalg.norm(tr - tl)
    max_width = max(int(width_a), int(width_b), 1)

    height_a = np.linalg.norm(tr - br)
    height_b = np.linalg.norm(tl - bl)
    max_height = max(int(height_a), int(height_b), 1)

    destination = np.array(
      [
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1],
      ],
      dtype="float32",
    )

    matrix = cv2.getPerspectiveTransform(rect, destination)
    warped = cv2.warpPerspective(image, matrix, (max_width, max_height))
    return warped, rect.tolist()


def detect_document_contour(image):
    import cv2  # type: ignore
    import numpy as np

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    edges = cv2.dilate(edges, kernel, iterations=2)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(
      edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
      return None

    image_area = image.shape[0] * image.shape[1]
    best = None
    best_area = 0.0

    for contour in contours:
      area = cv2.contourArea(contour)
      if area < image_area * 0.2:
        continue
      perimeter = cv2.arcLength(contour, True)
      approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
      if len(approx) == 4 and area > best_area:
        best = approx.reshape(4, 2).astype("float32")
        best_area = area

    if best is not None:
      return best

    contour = max(contours, key=cv2.contourArea)
    rect = cv2.minAreaRect(contour)
    box = cv2.boxPoints(rect)
    if cv2.contourArea(box) < image_area * 0.2:
      return None
    return box.astype("float32")


def deskew_image(image):
    import cv2  # type: ignore
    import numpy as np

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    inverted = cv2.bitwise_not(gray)
    _, thresholded = cv2.threshold(
      inverted, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU
    )

    coordinates = np.column_stack(np.where(thresholded > 0))
    if coordinates.size == 0:
      return image, 0.0

    angle = cv2.minAreaRect(coordinates)[-1]
    if angle < -45:
      angle = -(90 + angle)
    else:
      angle = -angle

    if abs(angle) < 0.2:
      return image, 0.0

    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
      image,
      matrix,
      (w, h),
      flags=cv2.INTER_CUBIC,
      borderMode=cv2.BORDER_REPLICATE,
    )
    return rotated, float(angle)


def crop_to_content(image):
    import cv2  # type: ignore

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresholded = cv2.threshold(
      gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU
    )
    coords = cv2.findNonZero(thresholded)
    if coords is None:
      return image, [0, 0, image.shape[1], image.shape[0]]

    x, y, w, h = cv2.boundingRect(coords)
    pad_x = max(8, int(image.shape[1] * 0.01))
    pad_y = max(8, int(image.shape[0] * 0.01))
    x0 = max(0, x - pad_x)
    y0 = max(0, y - pad_y)
    x1 = min(image.shape[1], x + w + pad_x)
    y1 = min(image.shape[0], y + h + pad_y)
    return image[y0:y1, x0:x1], [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def normalize_background(image):
    import cv2  # type: ignore
    import numpy as np

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    background = cv2.medianBlur(gray, 31)
    normalized = cv2.divide(gray, background, scale=255)
    normalized = cv2.normalize(normalized, None, 0, 255, cv2.NORM_MINMAX)
    colored = cv2.cvtColor(normalized, cv2.COLOR_GRAY2BGR)
    return colored, {
      "averageBrightness": float(np.mean(gray)),
      "contrastScore": float(np.std(gray)),
    }


def enhance_mode(image, mode):
    import cv2  # type: ignore

    if mode == "original":
      return image

    normalized, metrics = normalize_background(image)
    gray = cv2.cvtColor(normalized, cv2.COLOR_BGR2GRAY)

    if mode == "color":
      return cv2.detailEnhance(image, sigma_s=10, sigma_r=0.15)

    if mode == "grayscale":
      return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    if mode == "black_white":
      bw = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        15,
      )
      return cv2.cvtColor(bw, cv2.COLOR_GRAY2BGR)

    sharpened = cv2.GaussianBlur(gray, (0, 0), 2.5)
    document = cv2.addWeighted(gray, 1.5, sharpened, -0.5, 0)
    return cv2.cvtColor(document, cv2.COLOR_GRAY2BGR)


def resize_to_page_format(image, page_format):
    import cv2  # type: ignore
    import numpy as np

    if page_format in {"auto", "original"}:
      return image

    targets = {
      "a4_portrait": (1654, 2339),
      "a4_landscape": (2339, 1654),
      "a5": (1748, 2480),
      "letter": (1700, 2200),
      "legal": (1700, 2800),
    }
    if page_format not in targets:
      return image

    target_w, target_h = targets[page_format]
    canvas = np.full((target_h, target_w, 3), 255, dtype="uint8")
    h, w = image.shape[:2]
    scale = min(target_w / max(w, 1), target_h / max(h, 1))
    resized = cv2.resize(
      image,
      (max(1, int(w * scale)), max(1, int(h * scale))),
      interpolation=cv2.INTER_AREA,
    )
    y = (target_h - resized.shape[0]) // 2
    x = (target_w - resized.shape[1]) // 2
    canvas[y : y + resized.shape[0], x : x + resized.shape[1]] = resized
    return canvas


def maybe_run_unpaper(image_path: Path, output_path: Path):
    subprocess.run(
      [
        "unpaper",
        "--overwrite",
        "--no-border-align",
        "--no-mask-scan",
        str(image_path),
        str(output_path),
      ],
      check=True,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      text=True,
    )


def render_pdf_pages(input_pdf: Path, output_dir: Path):
    subprocess.run(
      [
        "pdftoppm",
        "-png",
        "-r",
        "220",
        str(input_pdf),
        str(output_dir / "page"),
      ],
      check=True,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      text=True,
    )
    return sorted(output_dir.glob("page-*.png"))


def build_pdf_from_images(images, output_pdf: Path):
    from PIL import Image  # type: ignore

    if not images:
      raise RuntimeError("No processed page images to assemble into PDF")

    pil_images = [Image.open(path).convert("RGB") for path in images]
    first = pil_images[0]
    rest = pil_images[1:]
    first.save(output_pdf, save_all=True, append_images=rest, resolution=220.0)
    for image in pil_images:
      image.close()


def process_page(
    source_path: Path,
    output_path: Path,
    mode: str,
    page_format: str,
    use_unpaper: bool,
    runtime: dict,
):
    import cv2  # type: ignore
    import numpy as np

    image = cv2.imread(str(source_path))
    if image is None:
      raise RuntimeError(f"Could not read page image: {source_path}")

    original_h, original_w = image.shape[:2]
    detected_contour = detect_document_contour(image)
    perspective_applied = False
    corrected_corners = None
    if detected_contour is not None:
      warped, corrected_corners = four_point_transform(image, detected_contour)
      image = warped
      perspective_applied = True

    image, skew_angle = deskew_image(image)
    image, bounds = crop_to_content(image)
    image = enhance_mode(image, mode)
    image = resize_to_page_format(image, page_format)

    cv2.imwrite(str(output_path), image)

    if use_unpaper and runtime["unpaper"]:
      unpaper_output = output_path.with_name(f"{output_path.stem}-unpaper.png")
      try:
        maybe_run_unpaper(output_path, unpaper_output)
        if unpaper_output.exists():
          image = cv2.imread(str(unpaper_output))
          if image is not None:
            cv2.imwrite(str(output_path), image)
      except Exception:
        pass

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return {
      "originalSize": {"width": int(original_w), "height": int(original_h)},
      "processedSize": {"width": int(image.shape[1]), "height": int(image.shape[0])},
      "detectedPageBounds": bounds,
      "correctedCorners": corrected_corners,
      "rotationAngle": 0,
      "skewAngle": float(round(skew_angle, 3)),
      "selectedProcessingMode": mode,
      "targetPageFormat": page_format,
      "whetherPerspectiveApplied": perspective_applied,
      "whetherUnpaperApplied": bool(use_unpaper and runtime["unpaper"]),
      "averageBrightness": float(round(float(gray.mean()), 3)),
      "contrastScore": float(round(float(gray.std()), 3)),
      "processingStatus": "enhanced",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--mode", default="document")
    parser.add_argument("--page-format", default="auto")
    parser.add_argument("--use-unpaper", default="false")
    parser.add_argument("--original-pages-dir")
    parser.add_argument("--processed-pages-dir")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    metadata_path = Path(args.metadata)
    warnings: list[str] = []
    use_unpaper = bool_flag(args.use_unpaper)
    emitted_original_pages_dir = (
      Path(args.original_pages_dir) if args.original_pages_dir else None
    )
    emitted_processed_pages_dir = (
      Path(args.processed_pages_dir) if args.processed_pages_dir else None
    )

    runtime = {
      "python3": True,
      "cv2": False,
      "numpy": False,
      "pillow": False,
      "pdftoppm": command_exists("pdftoppm"),
      "unpaper": command_exists("unpaper"),
      "tesseract": command_exists("tesseract"),
    }

    try:
      import cv2  # type: ignore
      import numpy  # type: ignore

      runtime["cv2"] = True
      runtime["numpy"] = True
      _ = cv2
      _ = numpy
    except Exception as exc:
      warnings.append(f"OpenCV/Numpy not available: {exc}")

    try:
      from PIL import Image  # type: ignore

      runtime["pillow"] = True
      _ = Image
    except Exception as exc:
      warnings.append(f"Pillow not available: {exc}")

    metadata = {
      "status": "pass_through",
      "processingMode": args.mode,
      "targetPageFormat": args.page_format,
      "useUnpaperRequested": use_unpaper,
      "runtime": runtime,
      "warnings": warnings,
      "stages": ["pdf_ingest", "preprocess_placeholder", "pdf_emit"],
      "pageAnalyses": {},
    }

    can_process = (
      runtime["cv2"] and runtime["numpy"] and runtime["pillow"] and runtime["pdftoppm"]
    )
    if not can_process:
      shutil.copyfile(input_path, output_path)
      metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8"
      )
      return 0

    with tempfile.TemporaryDirectory(prefix="law-organizer-pdf-pages-") as temp_dir:
      temp_path = Path(temp_dir)
      source_pages_dir = temp_path / "source"
      processed_pages_dir = temp_path / "processed"
      source_pages_dir.mkdir(parents=True, exist_ok=True)
      processed_pages_dir.mkdir(parents=True, exist_ok=True)

      page_files = render_pdf_pages(input_path, source_pages_dir)
      processed_files = []
      page_analyses = {}

      if emitted_original_pages_dir is not None:
        emitted_original_pages_dir.mkdir(parents=True, exist_ok=True)
      if emitted_processed_pages_dir is not None:
        emitted_processed_pages_dir.mkdir(parents=True, exist_ok=True)

      for index, page_path in enumerate(page_files, start=1):
        processed_page_path = processed_pages_dir / f"processed-{index:04d}.png"
        analysis = process_page(
          page_path,
          processed_page_path,
          args.mode,
          args.page_format,
          use_unpaper,
          runtime,
        )
        page_analyses[str(index)] = analysis
        processed_files.append(processed_page_path)
        if emitted_original_pages_dir is not None:
          shutil.copyfile(
            page_path, emitted_original_pages_dir / f"page-{index:04d}.png"
          )
        if emitted_processed_pages_dir is not None:
          shutil.copyfile(
            processed_page_path,
            emitted_processed_pages_dir / f"page-{index:04d}.png",
          )

      build_pdf_from_images(processed_files, output_path)
      metadata = {
        "status": "processed",
        "processingMode": args.mode,
        "targetPageFormat": args.page_format,
        "useUnpaperRequested": use_unpaper,
        "runtime": runtime,
        "warnings": warnings,
        "stages": [
          "pdf_ingest",
          "page_render",
          "document_contour_detection",
          "perspective_correction",
          "deskew",
          "crop",
          "background_normalization",
          "contrast_enhancement",
          "pdf_emit",
        ],
        "pageCount": len(page_files),
        "pageAnalyses": page_analyses,
      }

    metadata_path.write_text(
      json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
