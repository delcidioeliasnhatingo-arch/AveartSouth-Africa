FROM pytorch/pytorch:2.4.1-cuda12.1-cudnn9-runtime
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 FASHN_WEIGHTS_DIR=/opt/fashn/weights
RUN apt-get update && apt-get install -y --no-install-recommends git libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/fashn-AI/fashn-vton-1.5.git /opt/fashn-vton-1.5
WORKDIR /opt/fashn-vton-1.5
RUN pip install -e . && pip install fastapi==0.115.12 "uvicorn[standard]==0.34.2" "Pillow>=10.4,<12"
COPY service/fashn-vton/server.py /opt/fashn-vton-1.5/aveart_server.py
RUN python scripts/download_weights.py --weights-dir /opt/fashn/weights
EXPOSE 8000
CMD ["uvicorn", "aveart_server:app", "--host", "0.0.0.0", "--port", "8000"]
