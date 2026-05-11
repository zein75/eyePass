import io
from contextlib import asynccontextmanager

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, HTTPException, UploadFile
from insightface.app import FaceAnalysis

face_analyzer: FaceAnalysis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global face_analyzer
    fa = FaceAnalysis(name='buffalo_sc', root='/app/models', providers=['CPUExecutionProvider'])
    fa.prepare(ctx_id=0, det_size=(640, 640))
    face_analyzer = fa
    yield


app = FastAPI(title='eyePass Face Service', version='0.1.0', lifespan=lifespan)


@app.get('/health')
async def health():
    return {'status': 'ok', 'model_loaded': face_analyzer is not None}


@app.post('/enroll')
async def enroll(files: list[UploadFile] = File(...)):
    if face_analyzer is None:
        raise HTTPException(status_code=503, detail='Model not loaded')

    embeddings: list[list[float]] = []

    for file in files:
        content = await file.read()
        try:
            img = np.array(Image.open(io.BytesIO(content)).convert('RGB'))
        except Exception:
            raise HTTPException(status_code=422, detail=f'Cannot decode image: {file.filename}')

        faces = face_analyzer.get(img)
        if not faces:
            raise HTTPException(status_code=422, detail=f'No face detected in {file.filename}')

        best = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        embeddings.append(best.embedding.tolist())

    return {'embeddings': embeddings, 'count': len(embeddings)}


@app.post('/recognize')
async def recognize(file: UploadFile = File(...)):
    if face_analyzer is None:
        raise HTTPException(status_code=503, detail='Model not loaded')

    content = await file.read()
    try:
        img = np.array(Image.open(io.BytesIO(content)).convert('RGB'))
    except Exception:
        return {'found': False, 'embedding': None}

    faces = face_analyzer.get(img)
    if not faces:
        return {'found': False, 'embedding': None}

    best = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    return {'found': True, 'embedding': best.embedding.tolist()}

