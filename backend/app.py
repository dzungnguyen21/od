from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from PIL import Image
import io
import torchvision.transforms as T
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# Load models
models = {
    'yolo11n.pt': YOLO('yolo11n.pt'),
    'yolo8n.pt': YOLO('yolo8n.pt'),
    # Add more models as needed
}

# Default model
current_model = models['yolo11n.pt']

def run_inference(model, img):
    """Run inference on the input image and return detections."""
    # Ultralytics YOLO expects numpy array or file path
    results = model(img)
    detections = []
    for result in results:
        boxes = result.boxes
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            label = model.names[cls] if hasattr(model, 'names') else str(cls)
            detections.append({
                'label': label,
                'confidence': conf,
                'box': [int(x1), int(y1), int(x2), int(y2)]
            })
    return detections

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    model_name = request.form.get('model', 'yolo11n.pt')
    
    # Select the model
    if model_name in models:
        selected_model = models[model_name]
    else:
        selected_model = models['yolo11n.pt']  # fallback to default
    
    img_bytes = file.read()
    img = Image.open(io.BytesIO(img_bytes))
    
    detections = run_inference(selected_model, img)
    return jsonify({'detections': detections})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
