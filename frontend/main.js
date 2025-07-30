// main.js - extracted from index.html
const initialOptions = document.getElementById('initial-options');
const uploadForm = document.getElementById('uploadForm');
const detectBtn = uploadForm.querySelector('button[type="submit"]');
const imageInput = document.getElementById('imageInput');
const cameraBtn = document.getElementById('cameraBtn');
const resetBtn = document.getElementById('resetBtn');

const preview = document.getElementById('preview');
const camera = document.getElementById('camera');
const captureBtn = document.getElementById('captureBtn');
const realTimeBtn = document.getElementById('realTimeBtn');
const stopRealTimeBtn = document.getElementById('stopRealTimeBtn');
const detectionCanvas = document.getElementById('detectionCanvas');
const ctx = detectionCanvas.getContext('2d');

const resultText = document.getElementById('result-text');
const loader = document.getElementById('loader');
const modelSelect = document.getElementById('modelSelect');
const resultsBoard = document.getElementById('results-board');
const detectionList = document.getElementById('detection-list');

let capturedBlob = null;
let imageFile = null;
let isRealTimeDetection = false;
let detectionInterval = null;

function drawDetections(imageElement, detections) {
    detectionCanvas.width = imageElement.clientWidth;
    detectionCanvas.height = imageElement.clientHeight;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const font = "16px Poppins";
    ctx.font = font;
    ctx.textBaseline = "top";
    const scaleX = imageElement.clientWidth / imageElement.naturalWidth;
    const scaleY = imageElement.clientHeight / imageElement.naturalHeight;
    detections.forEach(detection => {
        drawDetectionBox(detection, scaleX, scaleY);
    });
    resultText.textContent = `Found ${detections.length} objects!`;
}

function drawSingleDetection(imageElement, detection) {
    detectionCanvas.width = imageElement.clientWidth;
    detectionCanvas.height = imageElement.clientHeight;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const font = "16px Poppins";
    ctx.font = font;
    ctx.textBaseline = "top";
    const scaleX = imageElement.clientWidth / imageElement.naturalWidth;
    const scaleY = imageElement.clientHeight / imageElement.naturalHeight;
    drawDetectionBox(detection, scaleX, scaleY);
}

function drawTop2Detections(imageElement, top2Detections) {
    detectionCanvas.width = imageElement.clientWidth;
    detectionCanvas.height = imageElement.clientHeight;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const font = "16px Poppins";
    ctx.font = font;
    ctx.textBaseline = "top";
    const scaleX = imageElement.clientWidth / imageElement.naturalWidth;
    const scaleY = imageElement.clientHeight / imageElement.naturalHeight;

    // Draw each of the top 2 detections with different colors
    top2Detections.forEach((detection, index) => {
        drawDetectionBoxWithColor(detection, scaleX, scaleY, index);
    });
}

function drawDetectionBoxWithColor(detection, scaleX, scaleY, index) {
    const [x1, y1, x2, y2] = detection.box;
    const label = detection.label;
    const confidence = (detection.confidence * 100).toFixed(1);
    const scaledX = x1 * scaleX;
    const scaledY = y1 * scaleY;
    const scaledWidth = (x2 - x1) * scaleX;
    const scaledHeight = (y2 - y1) * scaleY;

    // Different colors for top 2: Green for #1, Blue for #2
    const colors = ['#28a745', '#007bff'];
    const color = colors[index] || '#28a745';

    const text = `${index === 0 ? '#1' : '#2'} ${label} (${confidence}%)`;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = color;
    ctx.fillRect(scaledX, scaledY, textWidth + 8, 20);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, scaledX + 4, scaledY + 2);
}

function displayResultsBoard(detections, highestConfidenceDetection) {
    if (!detections || detections.length === 0) {
        resultsBoard.style.display = 'none';
        return;
    }

    // Sort detections by confidence (highest first)
    const sortedDetections = [...detections].sort((a, b) => b.confidence - a.confidence);

    detectionList.innerHTML = '';

    sortedDetections.forEach(detection => {
        const item = document.createElement('div');
        item.className = 'detection-item';

        if (highestConfidenceDetection &&
            detection.label === highestConfidenceDetection.label &&
            Math.abs(detection.confidence - highestConfidenceDetection.confidence) < 0.001) {
            item.classList.add('highest-confidence');
        }

        item.innerHTML = `
            <span class="detection-label">${detection.label}</span>
            <div>
                <span class="detection-confidence">${(detection.confidence * 100).toFixed(1)}%</span>
                ${item.classList.contains('highest-confidence') ? '<span class="highest-confidence-badge">Highest</span>' : ''}
            </div>
        `;

        detectionList.appendChild(item);
    });

    resultsBoard.style.display = 'block';
}
function drawDetectionBox(detection, scaleX, scaleY) {
    const [x1, y1, x2, y2] = detection.box;
    const label = detection.label;
    const confidence = (detection.confidence * 100).toFixed(1);
    const scaledX = x1 * scaleX;
    const scaledY = y1 * scaleY;
    const scaledWidth = (x2 - x1) * scaleX;
    const scaledHeight = (y2 - y1) * scaleY;
    const text = `${label} (${confidence}%)`;
    ctx.strokeStyle = "var(--success-color)";
    ctx.lineWidth = 3;
    ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = "var(--success-color)";
    ctx.fillRect(scaledX, scaledY, textWidth + 8, 20);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, scaledX + 4, scaledY + 2);
}
function resetUI() {
    capturedBlob = null;
    imageFile = null;
    isRealTimeDetection = false;
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    preview.style.display = 'none';
    camera.style.display = 'none';
    captureBtn.style.display = 'none';
    realTimeBtn.style.display = 'none';
    stopRealTimeBtn.style.display = 'none';
    uploadForm.style.display = 'none';
    resetBtn.style.display = 'none';
    resultsBoard.style.display = 'none';
    ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
    imageInput.value = '';
    initialOptions.style.display = 'block';
    resultText.textContent = 'Please select an image or use your camera.';
    detectBtn.disabled = true;
    if (camera.srcObject) {
        camera.srcObject.getTracks().forEach(track => track.stop());
        camera.srcObject = null;
    }
}
function prepareForDetection() {
    initialOptions.style.display = 'none';
    uploadForm.style.display = 'block';
    resetBtn.style.display = 'block';
    detectBtn.disabled = false;
    ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
}

function startRealTimeDetection() {
    if (!camera.srcObject || isRealTimeDetection) return;

    isRealTimeDetection = true;
    resultText.textContent = 'Real-time detection active...';

    detectionInterval = setInterval(() => {
        if (!isRealTimeDetection || !camera.srcObject) {
            clearInterval(detectionInterval);
            return;
        }

        // Capture current frame from video
        const canvas = document.createElement('canvas');
        canvas.width = camera.videoWidth;
        canvas.height = camera.videoHeight;
        canvas.getContext('2d').drawImage(camera, 0, 0);

        canvas.toBlob(blob => {
            if (!isRealTimeDetection) return;

            const formData = new FormData();
            formData.append('image', blob, 'frame.jpg');
            formData.append('model', modelSelect.value);

            console.log('Sending model:', modelSelect.value); // Debug log

            fetch('http://localhost:5000/detect', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (isRealTimeDetection && data.detections) {
                        console.log('Detections received:', data.detections); // Debug log
                        console.log('Model used:', data.model_used); // Debug log
                        drawDetectionsOnVideo(data.detections);
                    }
                })
                .catch(err => {
                    console.error('Real-time detection error:', err);
                });
        }, 'image/jpeg', 0.8);

    }, 500); // Detection every 500ms
}

function stopRealTimeDetection() {
    isRealTimeDetection = false;
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
    resultText.textContent = 'Real-time detection stopped.';
}

function drawDetectionsOnVideo(detections) {
    if (!camera.clientWidth || !camera.clientHeight) return;

    // Ensure canvas dimensions match video display size
    detectionCanvas.width = camera.clientWidth;
    detectionCanvas.height = camera.clientHeight;
    ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);

    const font = "16px Poppins";
    ctx.font = font;
    ctx.textBaseline = "top";

    // Calculate scaling factors from video resolution to display size
    const scaleX = camera.clientWidth / camera.videoWidth;
    const scaleY = camera.clientHeight / camera.videoHeight;

    detections.forEach(detection => {
        const [x1, y1, x2, y2] = detection.box;
        const label = detection.label;
        const confidence = (detection.confidence * 100).toFixed(1);

        const scaledX = x1 * scaleX;
        const scaledY = y1 * scaleY;
        const scaledWidth = (x2 - x1) * scaleX;
        const scaledHeight = (y2 - y1) * scaleY;

        const text = `${label} (${confidence}%)`;

        // Draw bounding box with green color
        ctx.strokeStyle = "#28a745";
        ctx.lineWidth = 3;
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

        // Draw label background
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = "#28a745";
        ctx.fillRect(scaledX, scaledY, textWidth + 8, 20);

        // Draw label text
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, scaledX + 4, scaledY + 2);
    });

    // Update result text with detection count
    if (detections.length > 0) {
        resultText.textContent = `Real-time detection: ${detections.length} objects detected`;
    } else {
        resultText.textContent = 'Real-time detection active... No objects detected';
    }
}
cameraBtn.onclick = handleCameraClick;
captureBtn.onclick = handleCaptureClick;
realTimeBtn.onclick = () => {
    startRealTimeDetection();
    realTimeBtn.style.display = 'none';
    stopRealTimeBtn.style.display = 'block';
    captureBtn.style.display = 'none';
};
stopRealTimeBtn.onclick = () => {
    stopRealTimeDetection();
    realTimeBtn.style.display = 'block';
    stopRealTimeBtn.style.display = 'none';
    captureBtn.style.display = 'block';
};
imageInput.onchange = handleImageInputChange;
uploadForm.onsubmit = handleUploadFormSubmit;
resetBtn.onclick = resetUI;
resetUI();
function handleCameraClick() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                camera.style.display = 'block';
                captureBtn.style.display = 'block';
                realTimeBtn.style.display = 'block';
                preview.style.display = 'none';
                resultText.textContent = 'Camera ready. Click "Start Real-time Detection" or "Capture Photo".';
                camera.srcObject = stream;
                initialOptions.style.display = 'none';
                resetBtn.style.display = 'block';

                // Set up detection canvas for real-time overlay
                camera.onloadedmetadata = () => {
                    detectionCanvas.width = camera.clientWidth;
                    detectionCanvas.height = camera.clientHeight;
                    // Ensure canvas is properly positioned over video
                    detectionCanvas.style.display = 'block';
                };
            })
            .catch(err => {
                resultText.textContent = `Error accessing camera: ${err.message}`;
            });
    } else {
        resultText.textContent = "Your browser does not support the camera API.";
    }
}
function handleCaptureClick() {
    const canvas = document.createElement('canvas');
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    canvas.getContext('2d').drawImage(camera, 0, 0);
    canvas.toBlob(blob => {
        capturedBlob = blob;
        imageFile = null;
        preview.src = URL.createObjectURL(blob);
        preview.style.display = 'block';
        camera.style.display = 'none';
        captureBtn.style.display = 'none';
        resultText.textContent = 'Image captured! Ready to detect objects.';
        if (camera.srcObject) camera.srcObject.getTracks().forEach(track => track.stop());
        prepareForDetection();
    }, 'image/jpeg');
}
function handleImageInputChange(event) {
    const file = event.target.files[0];
    if (file) {
        imageFile = file;
        capturedBlob = null;
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
        resultText.textContent = 'Image loaded! Ready to detect objects.';
        prepareForDetection();
    }
}
function handleUploadFormSubmit(e) {
    e.preventDefault();
    detectBtn.disabled = true;
    loader.style.display = 'block';
    resultText.textContent = 'Sending image to the server...';
    let finalImageFile = imageFile;
    if (capturedBlob && !finalImageFile) {
        finalImageFile = new File([capturedBlob], 'capture.jpg', { type: 'image/jpeg' });
    }
    if (!finalImageFile) return;
    const formData = new FormData();
    formData.append('image', finalImageFile);
    formData.append('model', modelSelect.value);

    console.log('Sending model for static detection:', modelSelect.value); // Debug log

    fetch('http://localhost:5000/detect', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || `Server responded with status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Static detection - Model used:', data.model_used); // Debug log
            if (data.detections && data.detections.length > 0) {
                // For static images: show results board and draw highest confidence bounding box
                displayResultsBoard(data.detections, data.highest_confidence_detection);

                if (data.highest_confidence_detection) {
                    if (preview.complete) {
                        drawSingleDetection(preview, data.highest_confidence_detection);
                    } else {
                        preview.onload = () => drawSingleDetection(preview, data.highest_confidence_detection);
                    }

                    // Check if we're showing high confidence (>80%) or top 10 detections
                    const highConfidenceCount = data.detections.filter(d => d.confidence > 0.80).length;
                    const isShowingTop10 = highConfidenceCount === 0;
                    const statusText = isShowingTop10 ? ' (from top 10 detections)' : ' (confidence > 80%)';

                    resultText.textContent = `Detection complete! Showing bounding box for highest confidence object: ${data.highest_confidence_detection.label} (${(data.highest_confidence_detection.confidence * 100).toFixed(1)}%)${statusText}`;
                } else {
                    resultText.textContent = `Found ${data.detections.length} objects! Check the results board below.`;
                }
            } else {
                resultsBoard.style.display = 'none';
                resultText.textContent = 'Server processed the image, but no objects were found.';
            }
        })
        .catch(err => {
            resultText.textContent = `Error: ${err.message}`;
            console.error(err);
        })
        .finally(() => {
            loader.style.display = 'none';
            detectBtn.disabled = false;
        });
}
