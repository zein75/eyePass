FROM python:3.11-slim

WORKDIR /app

# Системные зависимости для OpenCV, InsightFace и компиляции C-расширений
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    python3-dev \
    libgl1 \
    libglib2.0-0 \
    libopenblas-dev \
    liblapack-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Сначала устанавливаем Cython и numpy — insightface зависит от них при сборке
RUN pip install --no-cache-dir "cython<3" "numpy==1.26.4"

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
