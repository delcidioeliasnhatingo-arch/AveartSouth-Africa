# AVEART Virtual Fitting — open-source deployment

- **Live Camera:** MediaPipe Tasks Vision / Pose Landmarker runs locally in the customer's browser. Camera frames are not uploaded. The garment overlay is an approximate 2D preview, not a 3D fit simulation.
- **AI Photo Try-On:** FASHN VTON v1.5 (Apache-2.0) runs in a separate Python service with GPU inference. The Vercel function proxies requests to this private service; Gemini is not used.

## Deploy the inference service
The model cannot run inside a normal Vercel serverless function. It requires a GPU-capable host and persistent model weights. The root Dockerfile builds the upstream FASHN VTON v1.5 project and downloads the weights.

1. Build the root Dockerfile on a CUDA-capable GPU host.
2. Set a long random `FASHN_VTON_TOKEN` secret in the service environment.
3. Expose port 8000 behind HTTPS; do not expose the service without bearer-token authentication.
4. Set these Vercel server-side environment variables: `FASHN_VTON_URL` (private service base URL, no trailing slash) and `FASHN_VTON_TOKEN` (same secret).
5. Redeploy the Vercel preview. Photo Try-On stays disabled with a clear message until both variables exist. Live Camera works independently.

## Categories
The model accepts `tops`, `bottoms`, and `one-pieces`. Product pages map clothing categories to these values. Accessories and footwear remain excluded.

## Privacy and limitations
- Customer photos are sent to AVEART's server and then to the configured GPU service. The included service processes images in memory and does not intentionally persist them.
- Do not add image-body logging, permanent image storage, or analytics containing image data.
- AI can still alter garment details. The result is illustrative and does not guarantee exact colour, fabric, print, or fit.
- MediaPipe runtime/model assets are currently loaded from pinned public CDN URLs. Self-host these assets if required by deployment policy.
- FASHN VTON upstream is Apache-2.0; verify third-party component and model-asset licenses before commercial launch.

## Run the service
Install the upstream FASHN VTON package, download its model weights, set `FASHN_VTON_TOKEN`, and run `uvicorn aveart_server:app --host 0.0.0.0 --port 8000`. The service exposes `GET /health` and protected `POST /v1/try-on`.
