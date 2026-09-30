# syntax=docker/dockerfile:1.7
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1 MODELS_DIR=/app/models DATA_DIR=/data

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

ARG OPENCV_ZOO=https://media.githubusercontent.com/media/opencv/opencv_zoo/47534e27c9851bb1128ccc0102f1145e27f23f98/models
ADD --checksum=sha256:8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4 \
	${OPENCV_ZOO}/face_detection_yunet/face_detection_yunet_2023mar.onnx models/
ADD --checksum=sha256:0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79 \
	${OPENCV_ZOO}/face_recognition_sface/face_recognition_sface_2021dec.onnx models/

COPY worker ./worker

RUN useradd --system --uid 1001 --no-create-home worker && chmod -R a+r /app/models
USER worker

CMD ["python", "-m", "worker"]
