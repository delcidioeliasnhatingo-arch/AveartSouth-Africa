# AVEART Virtual Fitting — open-source deployment

- **Live Camera:** MediaPipe Tasks Vision / Pose Landmarker runs locally in the customer's browser. Camera frames are not uploaded. The garment overlay is an approximate 2D preview, not a 3D fit simulation.
- **AI Photo Try-On:** FASHN VTON v1.5 (Apache-2.0) runs in a separate Python service with GPU inference. The Vercel function proxies requests to this private service; Gemini is not used.

## Hosting plan note
The connected AVEART Vercel project is currently on the Hobby plan. Vercel describes Hobby as for personal, non-commercial use. Before serving the commercial AVEART storefront from Vercel in production, move to a plan that permits commercial use or move the storefront to a suitable commercial host. This fitting-room PR remains a preview and is not promoted to production.

## Deploy the inference service
The model cannot run inside a normal Vercel serverless function. It requires a GPU-capable host and persistent model weights. The root Dockerfile builds the upstream FASHN VTON v1.5 project and downloads the weights.

1. Build the root Dockerfile on a CUDA-capable GPU host.
2. Set a long random `FASHN_VTON_TOKEN` secret in the service environment.
3. Expose port 8000 behind HTTPS; do not expose the service without bearer-token authentication.
4. Set these Vercel server-side environment variables: `FASHN_VTON_URL` (private service base URL, no trailing slash) and `FASHN_VTON_TOKEN` (same secret).
5. Redeploy the Vercel preview. Photo Try-On stays disabled with a clear message until both variables exist. Live Camera works independently.

## Product-photo handling
The AVEART catalogue currently uses isolated, ghost-mannequin, or flat-lay product photography rather than customer-facing model photos. The inference service therefore sends `garment_photo_type="flat-lay"` to FASHN. The model accepts `tops`, `bottoms`, and `one-pieces`; product pages map clothing categories to these values. Accessories and footwear remain excluded.

## Free testing option
Hugging Face hosts a public FASHN demo and ZeroGPU can provide limited free GPU time for manual testing. This is not a dependable production backend: free-account ZeroGPU usage is quota-limited and queued, and a public Space receives the customer's photos. Do not route AVEART customer photos through a public Space without an explicit privacy review and clear customer consent. The production integration in this repository is the private, token-protected FASHN service above.

Leffa is another open-weight research option, but its supporting checkpoints and preprocessing components need a separate commercial-license audit before being added to a retail checkout flow. Non-commercial models such as IDM-VTON, CatVTON, and OOTDiffusion must not be used in AVEART's commercial storefront without separate commercial permission.

## Privacy and limitations
- Customer photos are sent to AVEART's server and then to the configured GPU service. The included service processes images in memory and does not intentionally persist them.
- Do not add image-body logging, permanent image storage, or analytics containing image data.
- AI can still alter garment details. The result is illustrative and does not guarantee exact colour, fabric, print, or fit.
- MediaPipe runtime/model assets are currently loaded from pinned public CDN URLs. Self-host these assets if required by deployment policy.
- FASHN VTON upstream is Apache-2.0; verify third-party component and model-asset licenses before commercial launch.

## Run the service
Install the upstream FASHN VTON package, download its model weights, set `FASHN_VTON_TOKEN`, and run `uvicorn aveart_server:app --host 0.0.0.0 --port 8000`. The service exposes `GET /health` and protected `POST /v1/try-on`.
