// server.js
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: `uploads/${Date.now()}_${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        const result = await s3.upload(params).promise();
        res.json({ success: true, url: result.Location });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
