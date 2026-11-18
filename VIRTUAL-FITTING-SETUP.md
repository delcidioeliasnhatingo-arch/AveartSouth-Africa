# AVEART Virtual Fitting — zero-hosted-inference architecture

## What runs for free

- **Photo Preview:** MediaPipe Tasks Vision / Pose Landmarker detects shoulders and hips from a user-selected photo in the browser. The browser composites the selected catalogue garment over the photo using a 2D canvas. The image is not sent to AVEART servers.
- **Live Camera:** MediaPipe Pose Landmarker tracks the user's pose in the browser and draws an approximate 2D garment overlay. Camera frames are not uploaded.
- **No hosted AI inference:** This implementation does not call FASHN, Gemini, a paid GPU provider, or an external try-on API. It does not generate a photorealistic garment replacement. It is a lightweight visual preview only.

## Privacy

- The selected customer photo, camera frames, and generated preview remain in the browser.
- The fitting-room code does not upload or persist customer photos.
- MediaPipe's pinned runtime and pose model are downloaded from public CDN endpoints. These downloads are model/runtime assets, not customer photos. If the site later self-hosts these assets, keep the same pinned versions and verify their licenses.
- Product photos must be served with CORS headers that allow the storefront origin so the browser can composite them into a canvas.

## Important visual limitations

- The overlay is approximate 2D compositing, not 3D cloth simulation or generative virtual try-on.
- It does not understand garment segmentation, folds, body occlusion, fabric drape, or exact sizing.
- Flat-lay catalogue images may contain background/whitespace; results depend heavily on clean, isolated product photography.
- The preview must not be presented as a guarantee of colour, fabric, fit, or size.
- Categories supported by the existing product-page integration are tops, bottoms, and one-pieces. Footwear and accessories are not supported.

## Hosting

The fitting-room feature requires no GPU server, inference token, paid AI API, or Python service. It runs in the customer's browser. The storefront itself still needs a host. The connected Vercel Hobby plan is restricted to personal/non-commercial use; before operating AVEART commercially, deploy the storefront on a host whose free plan permits commercial use, such as a suitable Cloudflare Workers/Static Assets setup, and verify the current plan terms and limits. This PR is a preview and does not change production hosting.

## Validation checklist

1. Test with a clear, front-facing, full-body photo.
2. Confirm shoulders and hips are detected.
3. Test garment image loading from the actual catalogue storage domain with CORS enabled.
4. Test both CPU fallback and GPU delegate in supported browsers.
5. Confirm no customer image requests are sent to AVEART endpoints in browser network inspection.
6. Keep the feature labelled as an approximate preview, not an AI fit guarantee.
