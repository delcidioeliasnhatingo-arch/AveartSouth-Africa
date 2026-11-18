import base64, hmac, io, os
from functools import lru_cache
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool
from fashn_vton import TryOnPipeline

MAX_BYTES = 3 * 1024 * 1024
TOKEN = os.environ.get("FASHN_VTON_TOKEN", "")
WEIGHTS_DIR = os.environ.get("FASHN_WEIGHTS_DIR", "/opt/fashn/weights")
app = FastAPI(title="AVEART Open-Source Virtual Try-On", docs_url=None, redoc_url=None)

class TryOnRequest(BaseModel):
    person_image: str = Field(min_length=100)
    person_mime_type: str = Field(pattern=r"^image/(jpeg|png|webp)$")
    garment_image: str = Field(min_length=100)
    garment_mime_type: str = Field(pattern=r"^image/(jpeg|png|webp)$")
    category: str = Field(default="tops", pattern=r"^(tops|bottoms|one-pieces)$")

def decode_image(value: str) -> Image.Image:
    try:
        raw = base64.b64decode(value, validate=True)
        if not raw or len(raw) > MAX_BYTES: raise HTTPException(status_code=413, detail="Image too large.")
        image = Image.open(io.BytesIO(raw)); image.verify()
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        if image.width * image.height > 20_000_000: raise HTTPException(status_code=413, detail="Image dimensions too large.")
        return image
    except HTTPException: raise
    except (ValueError, UnidentifiedImageError): raise HTTPException(status_code=400, detail="Invalid image data.")

@lru_cache(maxsize=1)
def get_pipeline():
    if not os.path.isdir(WEIGHTS_DIR): raise RuntimeError("FASHN model weights are missing.")
    return TryOnPipeline(weights_dir=WEIGHTS_DIR)

@app.get("/health")
def health():
    return {"status": "ok", "weights_present": os.path.isdir(WEIGHTS_DIR)}

@app.post("/v1/try-on")
async def try_on(payload: TryOnRequest, authorization: str | None = Header(default=None)):
    if not TOKEN or not authorization or not hmac.compare_digest(authorization, f"Bearer {TOKEN}"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    person, garment = decode_image(payload.person_image), decode_image(payload.garment_image)
    try:
        pipeline = await run_in_threadpool(get_pipeline)
        result = await run_in_threadpool(lambda: pipeline(person_image=person, garment_image=garment, category=payload.category))
        if not result.images: raise RuntimeError("No image returned.")
        output = io.BytesIO(); result.images[0].save(output, format="PNG", optimize=True)
        return {"image": base64.b64encode(output.getvalue()).decode("ascii")}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Model inference failed.") from exc
