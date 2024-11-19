let sourceImage = null;
let outputImage = null;
const sourceCanvas = document.getElementById('sourceCanvas');
const resultCanvas = document.getElementById('resultCanvas');
const loadImageInput = document.getElementById('loadImage');
const hiddenMessageInput = document.getElementById('hiddenMessage');
const lsbOptions = document.getElementsByName('lsb'); 

loadImageInput.addEventListener('change', loadImage);
document.getElementById('hideMessage').addEventListener('click', embedTextInImage);
document.getElementById('revealMessage').addEventListener('click', extractTextFromImage);
document.getElementById('exportImage').addEventListener('click', saveOutputImage);
document.getElementById('clear').addEventListener('click', resetApplication);

function loadImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                sourceCanvas.getContext('2d').drawImage(img, 0, 0, sourceCanvas.width, sourceCanvas.height);
                sourceImage = img;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function embedTextInImage() {
    if (!sourceImage) {
        alert("Please load a source image first!");
        return;
    }
    const hiddenText = hiddenMessageInput.value.trim();
    if (!hiddenText) {
        alert("Please enter a hidden message.");
        return;
    }
    
    // Get selected LSB count
    const lsbCount = Array.from(lsbOptions).find(option => option.checked).value;
    outputImage = insertTextIntoImage(sourceImage, hiddenText, lsbCount);
    const ctx = resultCanvas.getContext('2d');
    ctx.drawImage(outputImage, 0, 0, resultCanvas.width, resultCanvas.height);
}

function insertTextIntoImage(image, secret, lsbCount) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;


    const secretBinary = Array.from(secret)
        .map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('') + '00000000';

    let index = 0;
    for (let i = 0; i < data.length && index < secretBinary.length; i += 4) {
        for (let j = 0; j < lsbCount && index < secretBinary.length; j++) {
           
            data[i + j] = (data[i + j] & 0xFE) | parseInt(secretBinary[index++]); 
        }
    }

    ctx.putImageData(imageData, 0, 0); 
    console.log("Embedded binary data:", secretBinary); 
    return canvas;
}


function retrieveTextFromImage(image, lsbCount) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let secretBinary = '';

    for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < lsbCount; j++) {
            secretBinary += (data[i + j] & 1).toString(); 
        }
    }

    const secretChars = [];
    for (let i = 0; i < secretBinary.length; i += 8) {
        if (i + 8 > secretBinary.length) break;
        const charCode = parseInt(secretBinary.slice(i, i + 8), 2);
        if (charCode === 0) break;

        if (charCode >= 32 && charCode <= 126) {
            secretChars.push(String.fromCharCode(charCode));
        }
    }

    console.log("Extracted binary data:", secretBinary);
    return secretChars.join(''); 
}


function extractTextFromImage() {
    if (!outputImage && !sourceImage) {
        alert("Please load a source image first!");
        return;
    }
    
    
    const lsbCount = Array.from(lsbOptions).find(option => option.checked).value;
    const imgToUse = outputImage || sourceImage;
    const extractedText = retrieveTextFromImage(imgToUse, lsbCount);
    alert(`Extracted Text: ${extractedText || "No hidden message found."}`);
}



function saveOutputImage() {
    if (!outputImage) {
        alert("No output image to save!");
        return;
    }
    const link = document.createElement('a');
    link.download = 'output_image.bmp';
    link.href = resultCanvas.toDataURL('image/bmp');
    link.click();
}

function resetApplication() {
    sourceImage = null;
    outputImage = null;
    hiddenMessageInput.value = '';
    const sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    const resultCtx = resultCanvas.getContext('2d');
    resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
}
