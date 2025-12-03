from ultralytics import YOLO

# Load the model and run inference on the webcam
YOLO('best.pt').predict(source=0, show=True, save=False, project='runs/pose/output', name='tests', device = 0, conf = 0.6)