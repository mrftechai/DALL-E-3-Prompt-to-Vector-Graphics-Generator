const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const potrace = require('potrace');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: 'GET,PUT,POST,DELETE',
  optionsSuccessStatus: 204,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const apiKey = process.env.OPENAI_API_KEY;
const openaiUrl = 'https://api.openai.com/v1/images/generations';

// Ensure the directory exists
const imageSaveDirectory = path.join(__dirname, 'generated_images');
if (!fs.existsSync(imageSaveDirectory)) {
  fs.mkdirSync(imageSaveDirectory);
}

app.post('/generate-image', async (req, res) => {
  try {
    const { data, size, quality, autoSavePNG, autoSaveSVG, potraceOptions } = req.body;
    const response = await axios.post(openaiUrl, {
      model: "dall-e-3",
      prompt: data,
      n: 1,
      size: size,
      quality: quality,
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const imageUrl = response.data.data[0].url;

    if (!imageUrl) {
      console.error('Error: Generated image URL is undefined');
      res.status(500).json({ success: false, error: 'Internal Server Error' });
      return;
    }

    const result = {
      success: true,
      imageUrl,
    };

    // Vectorize the image on the server side with Potrace options
    vectorizeImage(imageUrl, potraceOptions, (svgData) => {
      result.svgData = svgData;

      // Optionally save SVG file if autoSaveSVG is true
      if (autoSaveSVG) {
        const svgFileName = `image_${Date.now()}.svg`;
        const svgFilePath = path.join(imageSaveDirectory, svgFileName);

        fs.writeFileSync(svgFilePath, svgData);
        console.log('SVG file saved successfully:', svgFilePath);

        result.svgFilePath = svgFilePath;
      }

      // Optionally save PNG file if autoSavePNG is true
      if (autoSavePNG) {
        saveImageFile(imageUrl, imageSaveDirectory, 'image_', '.png')
          .then((pngFilePath) => {
            result.pngFilePath = pngFilePath;
            res.json(result);
          })
          .catch((error) => {
            console.error('Error saving PNG file:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
          });
      } else {
        res.json(result);
      }
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.get('/proxy', async (req, res) => {
  console.log('Proxy endpoint called:', req.query.url);
  const imageUrl = decodeURIComponent(req.query.url);

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    res.writeHead(200, {
      'Content-Type': response.headers['content-type'],
      'Content-Length': response.headers['content-length'],
    });
    res.end(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error('Error proxying image:', error.response ? error.response.status : error.message);
    res.status(error.response ? error.response.status : 500).send('Internal Server Error');
  }
});

function vectorizeImage(imageUrl, options, callback) {
  axios.get(imageUrl, { responseType: 'arraybuffer' })
    .then(response => {
      const imageBuffer = Buffer.from(response.data);

      // Set default Potrace parameters
      const potraceOptions = {
        threshold: options.threshold || 255,
        turdsize: options.turdsize || 10,
        turnPolicy: options.turnPolicy || 'Majority',
        alphamax: options.alphamax || 1.3334,
        opticurve: options.opticurve !== true,
        optolerance: options.optolerance || 1000,
        unit: options.unit || 1.0,
        gamma: options.gamma || 1.0,
        backend: options.backend || 'svg'
      };

      potrace.trace(imageBuffer, potraceOptions, (err, svgData) => {
        if (err) {
          console.error('Error vectorizing image:', err);
          return;
        }

        // Log SVG data for debugging
        console.log('SVG Data:', svgData);

        // Send the SVG data to the callback
        callback(svgData);
      });
    })
    .catch(error => {
      console.error('Error downloading image for vectorization:', error);
    });
}

async function saveImageFile(imageUrl, directory, prefix, extension) {
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'stream', // Ensure response is treated as a stream
  });

  const fileName = `${prefix}${Date.now()}${extension}`;
  const filePath = path.join(directory, fileName);

  const writer = fs.createWriteStream(filePath);
  imageResponse.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log(`File saved successfully: ${filePath}`);
      resolve(filePath);
    });

    writer.on('error', (err) => {
      console.error('Error saving file:', err);
      reject(err);
    });
  });
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
