import express from 'express';
import bodyParser from 'body-parser';
import { filterImageFromURL, deleteLocalFiles } from './util/util.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// AWS S3 setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

app.use(bodyParser.json());

// Filtered image endpoint
app.get('/filteredimage', async (req, res) => {
  const { image_url } = req.query;

  if (!image_url) {
    return res.status(400).send({ message: 'image_url query parameter is required.' });
  }

  const validImageExtensions = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif'];
  const urlExtension = image_url.split('.').pop().toLowerCase();

  if (!validImageExtensions.includes(urlExtension)) {
    return res.status(415).send({ message: 'Provided URL does not point to a supported image format.' });
  }

  try {
    const filteredPath = await filterImageFromURL(image_url);

    // Read file into a buffer
    const fileContent = fs.readFileSync(filteredPath);
    const key = `filtered/filtered_${Date.now()}.jpg`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: 'image/jpeg'
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // Construct public S3 URL (assuming the bucket is public or presigned access)
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Clean up local temp file
    deleteLocalFiles([filteredPath]);

    // Return success with S3 URL
    return res.status(200).send({
      message: 'Image filtered and uploaded to S3 successfully.',
      s3_url: s3Url
    });
  } catch (error) {
    console.error('Error:', error.message);

    if (error.message.includes('Unsupported MIME') || error.message.includes('Could not find MIME')) {
      return res.status(415).send({ message: 'The URL does not point to a valid image.' });
    }

    return res.status(422).send({ message: 'Failed to process image from the provided URL.' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('try GET /filteredimage?image_url={{URL}}');
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Press CTRL+C to stop the server');
});
