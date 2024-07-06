const express = require('express');
const router = express.Router();
const axios = require('axios');
const potrace = require('potrace');
const fs = require('fs');
const path = require('path');

// Enable CORS
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve the main HTML file
router.get('/', (req, res) => {
  res.sendFile(__dirname + '/../public/index.html');
});

// OpenAI API configuration
const apiKey = 'Replace with-your-api-key-here';
const openaiUrl = 'https://api.openai.com/v1/images/generations';

// Directory for saving generated images
const saveDirectory = path.join(__dirname, '..', 'saved-images'); // Path to 'saved-images' directory

// Ensure the save directory exists, create it if not
if (!fs.existsSync(saveDirectory)) {
  fs.mkdirSync(saveDirectory, { recursive: true });
}

// Route for generating images
router.post('/generate-image', async (req, res) => {
  try {
    // Get the selected image size from the client-side
    const imageSize = req.body.size || "1024x1024";

    // Generate the image using the OpenAI API with the selected size
    const response = await axios.post(openaiUrl, {
      model: "dall-e-3",
      prompt: req.body.data,
      n: 1,
      size: imageSize,
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const imageUrl = response.data.data[0].url;

    // Vectorize the image on the server side
    vectorizeImage(imageUrl, (svgData) => {
      if (svgData) {
        // Generate a unique filename
        const filename = `image-${Date.now()}.svg`;
        const filePath = path.join(saveDirectory, filename);

        // Save SVG data to file
        fs.writeFile(filePath, svgData, (err) => {
          if (err) {
            console.error('Error saving SVG file:', err);
            res.status(500).json({ success: false, error: 'Failed to save SVG file' });
          } else {
            console.log('SVG file saved successfully:', filePath);

            // Send the image URL, SVG data, and file path to the client
            res.json({ success: true, imageUrl, svgData, filePath });
          }
        });
      } else {
        console.error('Error vectorizing image:', imageUrl);
        res.status(500).json({ success: false, error: 'Error vectorizing image' });
      }
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Proxy route for fetching images
router.get('/proxy', async (req, res) => {
  const imageUrl = decodeURIComponent(req.query.url);

  try {
    // Fetch the image from OpenAI
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    // Set the appropriate content type based on the image type
    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);

    // Send the image data to the client
    res.end(Buffer.from(response.data, 'binary)'));
  } catch (error) {
    console.error('Error proxying image:', error.response ? error.response.status : error.message);
    res.status(error.response ? error.response.status : 500).send('Internal Server Error');
  }
});

// Function to vectorize an image
function vectorizeImage(imageUrl, callback) {
  axios.get(imageUrl, { responseType: 'arraybuffer' })
    .then(response => {
      const imageBuffer = Buffer.from(response.data);
      potrace.trace(imageBuffer, (err, svg) => {
        if (err) {
          console.error('Error vectorizing image:', err);
          callback(null); // Pass null to indicate failure
        } else {
          console.log('Vectorization result:', svg);
          callback(svg);
        }
      });
    })
    .catch(error => {
      console.error('Error downloading image for vectorization:', error);
      callback(null); // Pass null to indicate failure
    });
}

module.exports = router;
