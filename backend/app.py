from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from PIL import Image
import io
import torchvision.transforms as T
from ultralytics import YOLO
import torchvision.models.detection

app = Flask(__name__)
CORS(app)

def load_fasterrcnn():
    model = torchvision.models.detection.fasterrcnn_resnet50_fpn(weights='DEFAULT')
    model.eval()
    return model

def load_detr():
    model = torchvision.models.detection.fasterrcnn_resnet50_fpn(weights='DEFAULT')
    model.eval()
    return model

def load_retinanet():
    model = torchvision.models.detection.retinanet_resnet50_fpn(weights='DEFAULT')
    model.eval()
    return model

# Class names for torchvision models (Pascal VOC classes)
COCO_CLASSES = [
    "__background__",  # 0
    "person",          # 1
    "bicycle",         # 2
    "car",             # 3
    "motorcycle",      # 4
    "airplane",        # 5
    "bus",             # 6
    "train",           # 7
    "truck",           # 8
    "boat",            # 9
    "traffic light",   # 10
    "fire hydrant",    # 11
    "stop sign",       # 12
    "parking meter",   # 13
    "bench",           # 14
    "bird",            # 15
    "cat",             # 16
    "dog",             # 17
    "horse",           # 18
    "sheep",           # 19
    "cow",             # 20
    "elephant",        # 21
    "bear",            # 22
    "zebra",           # 23
    "giraffe",         # 24
    "backpack",        # 25
    "umbrella",        # 26
    "handbag",         # 27
    "tie",             # 28
    "suitcase",        # 29
    "frisbee",         # 30
    "skis",            # 31
    "snowboard",       # 32
    "sports ball",     # 33
    "kite",            # 34
    "baseball bat",    # 35
    "baseball glove",  # 36
    "skateboard",      # 37
    "surfboard",       # 38
    "tennis racket",   # 39
    "bottle",          # 40
    "wine glass",      # 41
    "cup",             # 42
    "fork",            # 43
    "knife",           # 44
    "spoon",           # 45
    "bowl",            # 46
    "banana",          # 47
    "apple",           # 48
    "sandwich",        # 49
    "orange",          # 50
    "broccoli",        # 51
    "carrot",          # 52
    "hot dog",         # 53
    "pizza",           # 54
    "donut",           # 55
    "cake",            # 56
    "chair",           # 57
    "couch",           # 58
    "potted plant",    # 59
    "bed",             # 60
    "dining table",    # 61
    "toilet",          # 62
    "tv",              # 63
    "laptop",          # 64
    "mouse",           # 65
    "remote",          # 66
    "keyboard",        # 67
    "cell phone",      # 68
    "microwave",       # 69
    "oven",            # 70
    "toaster",         # 71
    "sink",            # 72
    "refrigerator",    # 73
    "book",            # 74
    "clock",           # 75
    "vase",            # 76
    "scissors",        # 77
    "teddy bear",      # 78
    "hair drier",      # 79
    "toothbrush"       # 80
]


# Load models
models = {
    'yolo11n.pt': YOLO('yolo11n.pt'),
    'yolo8n.pt': YOLO('yolo8n.pt'),
    'fasterrcnn.pt': load_fasterrcnn(),
    'rtdetr-l-voc.pt': load_detr(),
    'retinanet_voc_model.pt': load_retinanet(),
    # Add more models as needed
}

# Default model
current_model = models['yolo11n.pt']

# def run_inference(model, img):
#     """Run inference on the input image and return detections."""
#     # Ultralytics YOLO expects numpy array or file path
#     results = model(img)
#     detections = []
#     for result in results:
#         boxes = result.boxes
#         for box in boxes:
#             x1, y1, x2, y2 = box.xyxy[0].tolist()
#             conf = float(box.conf[0])
#             cls = int(box.cls[0])
#             label = model.names[cls] if hasattr(model, 'names') else str(cls)
#             detections.append({
#                 'label': label,
#                 'confidence': conf,
#                 'box': [int(x1), int(y1), int(x2), int(y2)]
#             })
#     return detections

def run_inference(model, img):
    """Run inference on the input image and return detections."""
    
    detections = []

    if isinstance(model, YOLO):
        results = model(img)
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                label = model.names[cls] if hasattr(model, 'names') else str(cls)
                detections.append({
                    'label': label,
                    'confidence': conf,
                    'box': [int(x1), int(y1), int(x2), int(y2)]
                })

    else:
        transform = T.Compose([
            T.ToTensor()
        ])
        img_tensor = transform(img)
        with torch.no_grad():
            outputs = model([img_tensor])  # torchvision expects a list

        for i in range(len(outputs[0]['boxes'])):
            x1, y1, x2, y2 = outputs[0]['boxes'][i].tolist()
            conf = float(outputs[0]['scores'][i].item())
            cls = int(outputs[0]['labels'][i].item())
            
            # Map class index to class name
            if cls < len(COCO_CLASSES):
                label = COCO_CLASSES[cls]
            else:
                label = f'class_{cls}'  # fallback for unknown classes
            
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
        print(f"Using model: {model_name}")
    else:
        selected_model = models['yolo11n.pt']  # fallback to default
        print(f"Model {model_name} not found, using default: yolo11n.pt")
    
    img_bytes = file.read()
    img = Image.open(io.BytesIO(img_bytes))
    
    detections = run_inference(selected_model, img)
    
    # Store original detections for highest confidence detection
    all_detections = detections.copy()
    
    # Find the highest confidence detection from all detections
    highest_confidence_detection = None
    if all_detections:
        highest_confidence_detection = max(all_detections, key=lambda x: x['confidence'])
    
    # Filter detections with confidence > 0.80
    high_confidence_detections = [d for d in all_detections if d['confidence'] > 0.80]
    
    # If no detections above 0.80, select top 10 highest confidence detections
    if not high_confidence_detections:
        detections = sorted(all_detections, key=lambda x: x['confidence'], reverse=True)[:10]
    else:
        detections = high_confidence_detections

    return jsonify({
        'detections': detections,
        'highest_confidence_detection': highest_confidence_detection,
        'model_used': model_name if model_name in models else 'yolo11n.pt'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
