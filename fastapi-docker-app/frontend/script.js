const API_URL = '/api';
let selectedFile = null;
let webcamActive = false;
let webcamStream = null;

// DOM Elements - Image Mode
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const detectBtn = document.getElementById('detectBtn');
const clearBtn = document.getElementById('clearBtn');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const infoBox = document.getElementById('infoBox');
const loadingDiv = document.getElementById('loading');

// DOM Elements - Mode Selector
const modeImageBtn = document.getElementById('modeImageBtn');
const modeWebcamBtn = document.getElementById('modeWebcamBtn');
const imageMode = document.getElementById('imageMode');
const webcamMode = document.getElementById('webcamMode');

// DOM Elements - Webcam Mode
const webcamVideo = document.getElementById('webcamVideo');
const captureCanvas = document.getElementById('captureCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const startWebcamBtn = document.getElementById('startWebcamBtn');
const stopWebcamBtn = document.getElementById('stopWebcamBtn');
const webcamInfoBox = document.getElementById('webcamInfoBox');

// ============ MODE SWITCHING ============
modeImageBtn.addEventListener('click', () => {
    imageMode.classList.add('active');
    webcamMode.classList.remove('active');
    modeImageBtn.classList.add('active');
    modeWebcamBtn.classList.remove('active');
    stopWebcam();
});

modeWebcamBtn.addEventListener('click', () => {
    imageMode.classList.remove('active');
    webcamMode.classList.add('active');
    modeImageBtn.classList.remove('active');
    modeWebcamBtn.classList.add('active');
});

// ============ IMAGE MODE ============
uploadArea.addEventListener('click', () => imageInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '#e8f5e9';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.backgroundColor = '#f5f5f5';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '#f5f5f5';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }
    
    selectedFile = file;
    detectBtn.disabled = false;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    infoBox.innerHTML = `<p>File selected: <strong>${file.name}</strong></p>`;
}

detectBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    loadingDiv.style.display = 'flex';
    detectBtn.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const response = await fetch(`${API_URL}/detect`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            resultImage.src = `data:image/jpeg;base64,${result.image}`;
            displayDetectionInfo(result.detections);
        } else {
            infoBox.innerHTML = `<p style="color: red;">Error: ${result.error}</p>`;
        }
    } catch (error) {
        console.error('Detection error:', error);
        infoBox.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    } finally {
        loadingDiv.style.display = 'none';
        detectBtn.disabled = false;
    }
});

function displayDetectionInfo(detections) {
    if (detections.length === 0) {
        infoBox.innerHTML = '<p>No hands detected in the image</p>';
        return;
    }
    
    let html = `<p>Found <strong>${detections.length}</strong> hand(s)</p>`;
    
    detections.forEach((detection, idx) => {
        const confidence = (detection.confidence * 100).toFixed(2);
        const keypointCount = detection.keypoints ? detection.keypoints.length : 0;
        
        html += `
            <div class="detection-item">
                <h4>Hand ${idx + 1}</h4>
                <p>Confidence: <strong>${confidence}%</strong></p>
                <p>Keypoints: <strong>${keypointCount}</strong></p>
                ${detection.box ? `<p>Box: [${detection.box.map(v => Math.round(v)).join(', ')}]</p>` : ''}
            </div>
        `;
    });
    
    infoBox.innerHTML = html;
}

clearBtn.addEventListener('click', () => {
    selectedFile = null;
    imageInput.value = '';
    originalImage.src = '';
    resultImage.src = '';
    detectBtn.disabled = true;
    infoBox.innerHTML = '<p>Select an image to start</p>';
});

// ============ WEBCAM MODE ============
startWebcamBtn.addEventListener('click', async () => {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
        });
        
        webcamVideo.srcObject = webcamStream;
        webcamActive = true;
        startWebcamBtn.disabled = true;
        stopWebcamBtn.disabled = false;
        
        // Start detection loop
        detectWebcamFrame();
    } catch (error) {
        console.error('Webcam error:', error);
        webcamInfoBox.innerHTML = `<p style="color: red;">Error accessing webcam: ${error.message}</p>`;
    }
});

stopWebcamBtn.addEventListener('click', stopWebcam);

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
    }
    webcamActive = false;
    startWebcamBtn.disabled = false;
    stopWebcamBtn.disabled = true;
    webcamInfoBox.innerHTML = '<p>Start the webcam to see real-time detection</p>';
}

async function detectWebcamFrame() {
    if (!webcamActive) return;
    
    try {
        // Force capture and overlay canvas to 512x512
        if (captureCanvas.width !== 512 || captureCanvas.height !== 512) {
            captureCanvas.width = 512;
            captureCanvas.height = 512;
        }

        if (overlayCanvas.width !== 512 || overlayCanvas.height !== 512) {
            overlayCanvas.width = 512;
            overlayCanvas.height = 512;
        }

        // Draw video frame to capture canvas
        const ctx = captureCanvas.getContext('2d');
        ctx.drawImage(webcamVideo, 0, 0, captureCanvas.width, captureCanvas.height);

        // Convert capture canvas to blob and send to API
        captureCanvas.toBlob(async (blob) => {
            try {
                const formData = new FormData();
                formData.append('file', blob, 'frame.jpg');
                
                const response = await fetch(`${API_URL}/detect`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        // Draw annotated image (base64) onto overlay canvas
                        drawAnnotatedOverlay(result.image);
                        // Also update info box
                        displayWebcamDetectionInfo(result.detections);
                    }
                }
            } catch (error) {
                console.error('Webcam detection error:', error);
            }
            
            // Continue detection loop every 500ms
                setTimeout(detectWebcamFrame, 33);
        }, 'image/jpeg', 0.8);
    } catch (error) {
        console.error('Webcam frame error:', error);
            setTimeout(detectWebcamFrame, 33);
    }
}

// Draw the annotated base64 image returned by the API onto the overlay canvas
function drawAnnotatedOverlay(base64Image) {
    if (!overlayCanvas) return;
    const ctx = overlayCanvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        // Clear overlay and draw the annotated image scaled to canvas
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        ctx.drawImage(img, 0, 0, overlayCanvas.width, overlayCanvas.height);
    };
    img.src = `data:image/jpeg;base64,${base64Image}`;
}

function displayWebcamDetectionInfo(detections) {
    if (detections.length === 0) {
        webcamInfoBox.innerHTML = '<p>No hands detected</p>';
        return;
    }
    
    let html = `<p>Hands detected: <strong>${detections.length}</strong></p>`;
    
    detections.forEach((detection, idx) => {
        const confidence = (detection.confidence * 100).toFixed(2);
        const keypointCount = detection.keypoints ? detection.keypoints.length : 0;
        
        html += `
            <div class="detection-item">
                <p>Hand ${idx + 1}: ${confidence}% | ${keypointCount} keypoints</p>
            </div>
        `;
    });
    
    webcamInfoBox.innerHTML = html;
}