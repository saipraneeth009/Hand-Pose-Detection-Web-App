# 🤚 Hand Pose Detection - FastAPI Application

A real-time hand pose detection web application using YOLOv8, FastAPI, and Uvicorn. This application provides a modern web interface for uploading images and detecting hand poses using a pre-trained YOLO model.

## Features

- ✅ **Web-based Interface**: Clean, responsive UI for image upload and detection
- ✅ **Real-time Detection**: Fast hand pose detection using YOLOv8
- ✅ **REST API**: FastAPI endpoints for programmatic access
- ✅ **Dockerized**: Ready to deploy with Docker/Docker Compose
- ✅ **Drag & Drop**: Easy image upload with drag-and-drop support
- ✅ **Base64 Encoding**: Images transferred as base64 for API compatibility

## Project Structure

```
fastapi-docker-app
├── src
│   ├── main.py              # FastAPI app with CORS and static file serving
│   ├── api
│   │   └── routes.py        # Endpoint: /api/detect, /api/model-info
│   └── models
│       └── schemas.py       # Pydantic schemas for request/response
├── frontend
│   ├── index.html           # Web interface
│   ├── styles.css           # Responsive styling
│   └── script.js            # Client-side upload & detection logic
├── best.pt                  # Pre-trained YOLOv8 hand pose model
├── Dockerfile               # Docker image configuration
├── docker-compose.yml       # Multi-container orchestration
├── requirements.txt         # Python dependencies
├── .dockerignore            # Exclude unnecessary files from image
└── README.md                # This file
```

## Installation & Running

### Option 1: Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```bash
   cd src
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Access the web interface:**
   Open your browser and go to `http://localhost:8000`

### Option 2: Docker

1. **Build the Docker image:**
   ```bash
   docker build -t hand-pose-detection .
   ```

2. **Run the container:**
   ```bash
   docker run -p 8000:8000 hand-pose-detection
   ```

3. **Access the application:**
   Open your browser and go to `http://localhost:8000`

### Option 3: Docker Compose (Recommended)

1. **Start the application:**
   ```bash
   docker-compose up
   ```

2. **Access the application:**
   Open your browser and go to `http://localhost:8000`

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

## API Endpoints

### Health Check
- **GET** `/health`
  - Response: `{"status": "ok"}`

### Model Information
- **GET** `/api/model-info`
  - Response:
    ```json
    {
      "model_name": "YOLOv8 Hand Pose Detection",
      "confidence_threshold": 0.6,
      "device": "GPU"
    }
    ```

### Detect Hand Pose
- **POST** `/api/detect`
  - Request: Form data with image file
  - Response:
    ```json
    {
      "success": true,
      "image": "base64_encoded_image_with_detections",
      "detections": [
        {
          "keypoints": [[x1, y1], [x2, y2], ...],
          "confidence": 0.95
        }
      ],
      "error": ""
    }
    ```

## How It Works

1. User uploads an image via the web interface
2. JavaScript sends the image to `/api/detect` endpoint
3. FastAPI receives the image and passes it to YOLOv8 model
4. YOLO detects hand keypoints and returns results
5. Results are sent back as base64-encoded image with detections
6. Web interface displays the original and annotated images

## Requirements

- Python 3.10+
- Docker & Docker Compose (for containerized deployment)
- GPU support optional (for faster inference)

## Dependencies

See `requirements.txt` for complete list:
- FastAPI
- Uvicorn
- Pydantic
- OpenCV
- Ultralytics (YOLOv8)
- PyTorch
   ```

2. **Build the Docker image:**
   ```
   docker build -t fastapi-docker-app .
   ```

3. **Run the Docker container:**
   ```
   docker run -d -p 8000:8000 fastapi-docker-app
   ```

4. **Access the application:**
   Open your web browser and navigate to `http://localhost:8000` to view the web frontend.

## Usage

- The FastAPI application provides various API endpoints defined in `src/api/routes.py`.
- The frontend is served from `frontend/index.html` and interacts with the FastAPI backend.

## Dependencies

This project requires the following Python packages, which are listed in `requirements.txt`:

- FastAPI
- Uvicorn

## License

This project is licensed under the MIT License.