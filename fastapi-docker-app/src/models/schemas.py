from pydantic import BaseModel
from typing import List, Optional

class Keypoint(BaseModel):
    x: float
    y: float

class Detection(BaseModel):
    box: Optional[List[int]] = None  # [x1, y1, x2, y2]
    keypoints: List[List[float]]
    confidence: float

class Frame(BaseModel):
    image: str  # base64 encoded
    timestamp: int

class DetectionResponse(BaseModel):
    success: bool
    image: str  # base64 encoded image with detections drawn
    detections: List[Detection]
    error: str = ""

class YourSchema(BaseModel):
    id: Optional[int] = None
    name: str