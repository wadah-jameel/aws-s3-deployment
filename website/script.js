// AWS Configuration - Replace with your actual values
const AWS_CONFIG = {
    region: 'us-east-1', // Replace with your region
    bucketName: 'your-bucket-name', // Replace with your bucket name
    accessKeyId: 'YOUR_ACCESS_KEY_ID', // Replace with your access key
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY' // Replace with your secret key
};

// Initialize AWS SDK
AWS.config.update({
    region: AWS_CONFIG.region,
    accessKeyId: AWS_CONFIG.accessKeyId,
    secretAccessKey: AWS_CONFIG.secretAccessKey
});

const s3 = new AWS.S3();

// DOM Elements
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const uploadBtn = document.getElementById('uploadBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');

let selectedFiles = [];

// File selection handler
fileInput.addEventListener('change', handleFileSelect);

// Drag and drop functionality
const fileLabel = document.querySelector('.file-label');

fileLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileLabel.style.background = '#667eea';
    fileLabel.style.color = 'white';
});

fileLabel.addEventListener('dragleave', () => {
    fileLabel.style.background = '#f8f9ff';
    fileLabel.style.color = '#667eea';
});

fileLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    fileLabel.style.background = '#f8f9ff';
    fileLabel.style.color = '#667eea';
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

// Upload button handler
uploadBtn.addEventListener('click', uploadFiles);

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    selectedFiles = files;
    displayFileInfo();
    uploadBtn.disabled = files.length === 0;
}

function displayFileInfo() {
    if (selectedFiles.length === 0) {
        fileInfo.style.display = 'none';
        return;
    }

    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `
        <h3>Selected Files (${selectedFiles.length}):</h3>
        ${selectedFiles.map((file, index) => `
            <div class="file-item">
                <span>${file.name}</span>
                <span>${formatFileSize(file.size)}</span>
            </div>
        `).join('')}
    `;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadFiles() {
    if (selectedFiles.length === 0) return;

    uploadBtn.disabled = true;
    progressSection.style.display = 'block';
    resultsSection.innerHTML = '';

    const results = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = ((i + 1) / selectedFiles.length) * 100;
        
        try {
            await uploadSingleFile(file, i + 1);
            results.push({ file: file.name, status: 'success' });
        } catch (error) {
            console.error('Upload failed:', error);
            results.push({ file: file.name, status: 'error', error: error.message });
        }
        
        // Update progress
        progressFill.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';
    }
    
    displayResults(results);
    uploadBtn.disabled = false;
}

function uploadSingleFile(file, fileNumber) {
    return new Promise((resolve, reject) => {
        // Generate unique file name
        const timestamp = Date.now();
        const fileName = `uploads/${timestamp}_${file.name}`;
        
        const params = {
            Bucket: AWS_CONFIG.bucketName,
            Key: fileName,
            Body: file,
            ContentType: file.type || 'application/octet-stream'
        };

        const upload = s3.upload(params);
        
        upload.on('httpUploadProgress', (progress) => {
            const fileProgress = (progress.loaded / progress.total) * 100;
            console.log(`File ${fileNumber} progress: ${fileProgress.toFixed(2)}%`);
        });

        upload.send((err, data) => {
            if (err) {
                reject(err);
            } else {
                console.log('Upload successful:', data.Location);
                resolve(data);
            }
        });
    });
}

function displayResults(results) {
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    resultsSection.innerHTML = `
        <div class="success-message">
            ✅ Successfully uploaded ${successCount} file(s)
        </div>
        ${errorCount > 0 ? `
            <div class="error-message">
                ❌ Failed to upload ${errorCount} file(s)
            </div>
        ` : ''}
        
        <div class="file-results">
            ${results.map(result => `
                <div class="file-item ${result.status}">
                    <span>${result.file}</span>
                    <span>${result.status === 'success' ? '✅' : '❌'}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Reset for next upload
    setTimeout(() => {
        progressSection.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        selectedFiles = [];
        fileInput.value = '';
        fileInfo.style.display = 'none';
        uploadBtn.disabled = true;
    }, 3000);
}

// Configuration validation
function validateConfig() {
    const requiredFields = ['region', 'bucketName', 'accessKeyId', 'secretAccessKey'];
    const missingFields = requiredFields.filter(field => !AWS_CONFIG[field] || AWS_CONFIG[field].includes('YOUR_'));
    
    if (missingFields.length > 0) {
        resultsSection.innerHTML = `
            <div class="error-message">
                ⚠️ Configuration Error: Please update the following fields in script.js:
                <ul>
                    ${missingFields.map(field => `<li>${field}</li>`).join('')}
                </ul>
            </div>
        `;
        uploadBtn.disabled = true;
        return false;
    }
    return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    validateConfig();
});
