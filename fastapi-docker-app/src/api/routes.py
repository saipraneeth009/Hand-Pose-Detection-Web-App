import cv2
import numpy as np
import base64
import os
from fastapi import APIRouter, UploadFile, File
from ultralytics import YOLO
from models.schemas import DetectionResponse, Frame

router = APIRouter()

# Load YOLO model (will be cached after first load)
model = None

def get_model():
    global model
    if model is None:
        # Try to find best.pt in parent directory or current working directory
        model_path = os.path.join(os.path.dirname(__file__), "../../best.pt")
        if not os.path.exists(model_path):
            model_path = "best.pt"  # Fallback to current working directory
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path} or best.pt")
        model = YOLO(model_path)
    return model

def draw_detections(img, results):
    """
    Draw bounding boxes and keypoints on the image
    """
    img_annotated = img.copy()
    
    for result in results:
        if result.boxes is not None:
            # Draw bounding boxes
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                # Draw rectangle
                cv2.rectangle(img_annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
                # Draw confidence label
                label = f"Hand {confidence:.2f}"
                cv2.putText(img_annotated, label, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # Draw keypoints and skeletons for all hands
        if result.keypoints is not None and len(result.keypoints.xy) > 0:
            keypoints_list = result.keypoints.xy.cpu().numpy()
            # Define hand keypoint connections (YOLO hand pose format)
            connections = [
                (0, 1), (1, 2), (2, 3), (3, 4),  # Thumb
                (0, 5), (5, 6), (6, 7), (7, 8),  # Index
                (0, 9), (9, 10), (10, 11), (11, 12),  # Middle
                (0, 13), (13, 14), (14, 15), (15, 16),  # Ring
                (0, 17), (17, 18), (18, 19), (19, 20)  # Pinky
            ]
            for keypoints in keypoints_list:
                # Draw connections (skeleton)
                for start, end in connections:
                    if start < len(keypoints) and end < len(keypoints):
                        pt1 = tuple(map(int, keypoints[start]))
                        pt2 = tuple(map(int, keypoints[end]))
                        if pt1 != (0, 0) and pt2 != (0, 0):
                            cv2.line(img_annotated, pt1, pt2, (255, 0, 0), 2)
                # Draw keypoints as circles
                for i, kpt in enumerate(keypoints):
                    x, y = int(kpt[0]), int(kpt[1])
                    if x > 0 and y > 0:  # Valid keypoint
                        cv2.circle(img_annotated, (x, y), 5, (0, 0, 255), -1)
                        cv2.circle(img_annotated, (x, y), 5, (255, 0, 0), 2)
    
    return img_annotated

@router.post("/detect", response_model=DetectionResponse)
async def detect_pose(file: UploadFile = File(...)):
    """
    Detect hand pose in uploaded image - supports multiple hands
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Invalid image", "keypoints": [], "confidence": 0}
        
        model = get_model()
        results = model.predict(img, conf=0.6, device=0)
        
        detections = []
        
        # Process all detections from the result
        for result in results:
            if result.boxes is not None and len(result.boxes) > 0:
                # Iterate through ALL boxes and keypoints
                for i in range(len(result.boxes)):
                    box = result.boxes[i]
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    confidence = float(box.conf[0])
                    
                    keypoints_data = []
                    # Get keypoints for this specific hand
                    if result.keypoints is not None and i < len(result.keypoints.xy):
                        keypoints = result.keypoints.xy[i].cpu().numpy()
                        keypoints_data = keypoints.tolist()
                    
                    detections.append({
                        "box": [x1, y1, x2, y2],
                        "keypoints": keypoints_data,
                        "confidence": confidence
                    })
        
        # Draw detections on image
        img_annotated = draw_detections(img, results)
        
        # Encode image
        _, buffer = cv2.imencode('.jpg', img_annotated)
        img_base64 = base64.b64encode(buffer).decode()
        
        return {
            "success": True,
            "image": img_base64,
            "detections": detections,
            "error": ""
        }
    except Exception as e:
        return {
            "success": False,
            "image": "",
            "detections": [],
            "error": str(e)
        }

@router.get("/model-info")
async def model_info():
    """
    Get information about the loaded model
    """
    model = get_model()
    return {
        "model_name": "YOLOv8 Hand Pose Detection",
        "confidence_threshold": 0.6,
        "device": "GPU" if True else "CPU"
    }