document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generateBtn').addEventListener('click', generateImages);
});

async function generateImages() {
  const selectedStyle = document.getElementById('style').value;
  const mainInput = document.getElementById('imageData').value.trim();
  const parallelRequests = parseInt(document.getElementById('parallelRequests').value, 10);
  const imageSize = document.getElementById('imageSize').value;
  const quality = document.getElementById('quality').value;
  const resultContainer = document.getElementById('result');
  const autoSavePNG = shouldAutoSavePNG();
  const autoSaveSVG = shouldAutoSaveSVG();
  resultContainer.innerHTML = ''; // Clear previous results

  // Define predefined styles
  const predefinedStyles = {
    default: '',

    // Your predefined styles here
  };

  const stylePrompt = predefinedStyles[selectedStyle] || '';
  const combinedValue = `${mainInput}, ${stylePrompt}`;

  // Potrace options
  const potraceOptions = {
    threshold: parseInt(document.getElementById('potraceThreshold').value, 10) || 128,
    turdsize: parseInt(document.getElementById('potraceTurdsize').value, 10) || 2,
    turnPolicy: document.getElementById('potraceTurnPolicy').value || 'minority',
    alphamax: parseFloat(document.getElementById('potraceAlphamax').value) || 1.0,
    opticurve: document.getElementById('potraceOpticurve').checked,
    optolerance: parseFloat(document.getElementById('potraceOptolerance').value) || 0.2,
    unit: parseFloat(document.getElementById('potraceUnit').value) || 1.0,
    gamma: parseFloat(document.getElementById('potraceGamma').value) || 1.0,
    backend: document.getElementById('potraceBackend').value || 'svg'
  };

  try {
    const requests = Array.from({ length: parallelRequests }, async (_, index) => {
      try {
        const requestBody = {
          data: combinedValue,
          size: imageSize,
          quality: quality,
          autoSavePNG: autoSavePNG,
          autoSaveSVG: autoSaveSVG,
          potraceOptions: potraceOptions
        };

        const response = await fetch('/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image, status ${response.status}`);
        }

        const result = await response.json();
        console.log(`Request ${index + 1} - Result:`, result);

        if (result.success) {
          const imageElement = new Image();
          imageElement.src = result.imageUrl;
          imageElement.alt = 'Generated Image';
          imageElement.className = 'generated-image';

          const imageContainer = document.createElement('div');
          imageContainer.className = 'image-container';
          imageContainer.appendChild(imageElement);

          const qualityInfo = document.createElement('p');
          qualityInfo.innerText = `Quality: ${result.quality}`;
          imageContainer.appendChild(qualityInfo);

          const dropdownContainer = document.createElement('div');
          dropdownContainer.className = 'dropdown';

          const downloadBtn = document.createElement('button');
          downloadBtn.className = 'btn btn-secondary dropdown-toggle download-btn';
          downloadBtn.type = 'button';
          downloadBtn.id = `downloadDropdown_${index}`;
          downloadBtn.setAttribute('data-bs-toggle', 'dropdown');
          downloadBtn.setAttribute('aria-expanded', 'false');
          downloadBtn.innerText = 'Download';

          const dropdownMenu = document.createElement('div');
          dropdownMenu.className = 'dropdown-menu';
          dropdownMenu.setAttribute('aria-labelledby', `downloadDropdown_${index}`);

          const svgLink = document.createElement('a');
          svgLink.className = 'dropdown-item';
          svgLink.href = '#';
          svgLink.innerText = 'SVG';
          svgLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            console.log('Downloading SVG...');
            downloadSVG(result.svgData, `image_${index + 1}.svg`);
          });

          const pngLink = document.createElement('a');
          pngLink.className = 'dropdown-item';
          pngLink.href = '#';
          pngLink.innerText = 'PNG';
          pngLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            console.log('Downloading PNG...');
            downloadPNG(result.imageUrl, `image_${index + 1}.png`);
          });

          dropdownMenu.appendChild(svgLink);
          dropdownMenu.appendChild(pngLink);

          dropdownContainer.appendChild(downloadBtn);
          dropdownContainer.appendChild(dropdownMenu);

          imageContainer.appendChild(dropdownContainer);

          resultContainer.appendChild(imageContainer);
        } else {
          console.error('Error in generating image:', result.error);
        }
      } catch (error) {
        console.error(`Error in request ${index + 1}:`, error);
      }
    });

    await Promise.all(requests);
  } catch (error) {
    console.error('Error:', error);
  }
}

function shouldAutoSavePNG() {
  const isChecked = document.getElementById('autoSavePNGCheckbox').checked;
  console.log('Auto Save PNG Checkbox Checked:', isChecked);
  return isChecked;
}

function shouldAutoSaveSVG() {
  const isChecked = document.getElementById('autoSaveSVGCheckbox').checked;
  console.log('Auto Save SVG Checkbox Checked:', isChecked);
  return isChecked;
}

function downloadSVG(svgData, filename) {
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = window.URL.createObjectURL(blob);

  fetch(url)
    .then(response => response.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    })
    .catch(error => console.error('Error downloading SVG:', error))
    .finally(() => {
      window.URL.revokeObjectURL(url);
    });
}

function downloadPNG(imageUrl, filename) {
  fetch(`/proxy?url=${encodeURIComponent(imageUrl)}`, {
    method: 'GET',
    headers: { 'Accept': 'image/png' },
  })
    .then(response => response.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    })
    .catch(error => console.error('Error downloading PNG:', error))
    .finally(() => {
      URL.revokeObjectURL(url);
    });
}
