"""Local PaddleOCR sidecar for ingest-form (FEAT-005): the second extraction layer.

The API reads a PDF's own text and annotations first. It calls this service only for images,
and for PDFs whose text doesn't hold the answers (a scanned page saved as PDF). This service only
reads text: it returns words with boxes, and the API maps them to patient fields.

    POST /ocr     body: the raw bytes of a PDF (page 1 is rendered at 200 dpi), PNG or JPEG
                  200 {"engine", "model", "page": {"width", "height"},
                       "words": [{"text", "bbox": [x0, y0, x1, y1], "conf"}], "timing_ms"}
    GET  /health  200 {"status": "ok", "engine", "model"}

Safety on a laptop (see README "Setting up AI OCR"):
- One request at a time: HTTPServer is single-threaded, so memory stays at one page's peak.
- Images are scaled so the long side is at most MAX_SIDE_PX before OCR (a 12MP phone photo would
  otherwise multiply memory use).
- Binds 127.0.0.1 only. Logs method, path, status, size and duration; never document contents.

Usage: services/ocr-sidecar/.venv/bin/python services/ocr-sidecar/server.py
"""

from __future__ import annotations

import io
import json
import os
import signal
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST = "127.0.0.1"
PORT = int(os.environ.get("OCR_SIDECAR_PORT", "8307"))
MAX_BODY_BYTES = 25 * 1024 * 1024  # the largest upload limit Admin → General allows
MAX_SIDE_PX = 2400  # about 200 dpi for an A4 page
PDF_RENDER_DPI = 200
MODEL = "PP-OCRv6 (PaddleOCR default English pipeline)"

PDF_MAGIC = b"%PDF-"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
JPEG_MAGIC = b"\xff\xd8\xff"


def log(message: str) -> None:
    print(f"[ocr-sidecar] {message}", file=sys.stderr, flush=True)


def load_engine():
    # Imported here so `--help`-style mistakes fail fast without loading Paddle.
    from paddleocr import PaddleOCR

    return PaddleOCR(
        lang="en",
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )


def to_image(body: bytes):
    """Page 1 of a PDF, or the image itself, as RGB, long side at most MAX_SIDE_PX."""
    from PIL import Image

    if body.startswith(PDF_MAGIC):
        import pypdfium2 as pdfium

        try:
            pdf = pdfium.PdfDocument(body)
        except pdfium.PdfiumError as error:
            raise ValueError("unreadable pdf") from error  # starts with %PDF- but isn't a real PDF
        try:
            image = pdf[0].render(scale=PDF_RENDER_DPI / 72).to_pil().convert("RGB")
        finally:
            pdf.close()
    elif body.startswith(PNG_MAGIC) or body.startswith(JPEG_MAGIC):
        image = Image.open(io.BytesIO(body))
        from PIL import ImageOps

        image = ImageOps.exif_transpose(image).convert("RGB")  # phone photos carry their rotation in EXIF
    else:
        raise ValueError("unsupported")
    scale = MAX_SIDE_PX / max(image.size)
    if scale < 1:
        image = image.resize((round(image.width * scale), round(image.height * scale)))
    return image


def split_line(text: str, bbox: list[float], conf: float) -> list[dict]:
    """Paddle returns lines; the API's mapper works on words. Split with proportional x extents."""
    x0, y0, x1, y1 = bbox
    total = max(len(text), 1)
    words, pos = [], 0
    for token in text.split():
        idx = text.find(token, pos)
        pos = idx + len(token)
        a = x0 + (x1 - x0) * idx / total
        b = x0 + (x1 - x0) * (idx + len(token)) / total
        words.append({"text": token, "bbox": [round(a, 1), round(y0, 1), round(b, 1), round(y1, 1)], "conf": round(conf, 3)})
    return words


def read_words(engine, image) -> list[dict]:
    import numpy as np

    words: list[dict] = []
    for result in engine.predict(np.asarray(image)[:, :, ::-1]):  # Paddle expects BGR
        polys = result["rec_polys"] if "rec_polys" in result else result["dt_polys"]
        for text, score, poly in zip(result["rec_texts"], result["rec_scores"], polys):
            pts = np.asarray(poly)
            bbox = [float(pts[:, 0].min()), float(pts[:, 1].min()), float(pts[:, 0].max()), float(pts[:, 1].max())]
            words.extend(split_line(text, bbox, float(score)))
    return words


class Handler(BaseHTTPRequestHandler):
    engine = None

    def log_message(self, format: str, *args) -> None:  # noqa: A002 - BaseHTTPRequestHandler's name
        pass  # the default logger prints request lines with client details; log() is used instead

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - http.server naming
        if self.path == "/health":
            self.send_json(200, {"status": "ok", "engine": "paddleocr", "model": MODEL})
        else:
            self.send_json(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        started = time.perf_counter()
        status = 500
        size = int(self.headers.get("Content-Length") or 0)
        try:
            if self.path != "/ocr":
                status = 404
                self.send_json(status, {"error": "not_found"})
                return
            if size <= 0 or size > MAX_BODY_BYTES:
                status = 413
                self.send_json(status, {"error": "payload_too_large"})
                return
            body = self.rfile.read(size)
            try:
                image = to_image(body)
            except ValueError:
                status = 415
                self.send_json(status, {"error": "unsupported_media_type"})
                return
            rendered = time.perf_counter()
            words = read_words(self.engine, image)
            status = 200
            self.send_json(
                status,
                {
                    "engine": "paddleocr",
                    "model": MODEL,
                    "page": {"width": image.width, "height": image.height},
                    "words": words,
                    "timing_ms": {
                        "render": round((rendered - started) * 1000),
                        "ocr": round((time.perf_counter() - rendered) * 1000),
                    },
                },
            )
        except Exception as error:  # noqa: BLE001 - report the type only; messages can echo content
            log(f"OCR failed: {type(error).__name__}")
            status = 500
            self.send_json(status, {"error": "ocr_failed"})
        finally:
            log(f"POST {self.path} {status} {size}B {round((time.perf_counter() - started) * 1000)}ms")


def stop(signum: int, _frame) -> None:
    # Paddle's native threads can segfault during normal interpreter teardown (exit 139), so skip it.
    log(f"stopping on signal {signum}")
    os._exit(0)


def main() -> None:
    started = time.perf_counter()
    log("loading PaddleOCR models (first run downloads about 130MB to ~/.paddlex)")
    Handler.engine = load_engine()
    # After loading: Paddle installs its own signal handlers, which would replace these.
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    log(f"models loaded in {time.perf_counter() - started:.1f}s; listening on http://{HOST}:{PORT}")
    HTTPServer((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
