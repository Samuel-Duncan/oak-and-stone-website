// Function to compress an image
async function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }),
            );
          },
          'image/jpeg',
          quality,
        );
      };
    };
  });
}

// Function to handle file selection and compression
async function handleFileSelect(event) {
  const files = event.target.files;
  const compressedFiles = [];
  let totalSize = 0;
  const maxTotalSize = 10 * 1024 * 1024; // 10MB in bytes

  for (let i = 0; i < files.length; i++) {
    let compressedFile = await compressImage(
      files[i],
      1280,
      720,
      0.7,
    );

    // If the total size exceeds the limit, try compressing more
    while (
      totalSize + compressedFile.size > maxTotalSize &&
      compressedFile.size > 50000
    ) {
      compressedFile = await compressImage(
        compressedFile,
        1280,
        720,
        0.5,
      );
    }

    if (totalSize + compressedFile.size <= maxTotalSize) {
      compressedFiles.push(compressedFile);
      totalSize += compressedFile.size;
    } else {
      console.warn(
        `Skipping file ${files[i].name} as it would exceed the total size limit`,
      );
    }
  }

  // Replace the original FileList with our compressed FileList
  event.target.files = new FileList(compressedFiles);
}

// Custom FileList class to make our array of Files behave like a FileList
class FileList {
  constructor(files) {
    this.files = files;
  }

  item(index) {
    return this.files[index];
  }

  get length() {
    return this.files.length;
  }

  *[Symbol.iterator]() {
    yield* this.files;
  }
}

// Add event listener to the file input
document
  .getElementById('images')
  .addEventListener('change', handleFileSelect);

// Modify form submission to include compressed files
document
  .getElementById('projectForm')
  .addEventListener('submit', function (event) {
    event.preventDefault();

    const submitButton = document.getElementById('submitButton');
    const buttonText = submitButton.querySelector('.button-text');
    const spinner = submitButton.querySelector('.spinner-border');

    // Disable the button and show the spinner
    submitButton.disabled = true;
    buttonText.textContent = 'One moment...';
    spinner.classList.remove('d-none');

    // Create a new FormData object
    const formData = new FormData(this);

    // Send the form data using fetch
    fetch(this.action, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle the response
        if (data.success) {
          window.location.href = data.redirectUrl;
        } else {
          // Show error message
          const errorElement = document.createElement('div');
          errorElement.className = 'error-message';
          errorElement.textContent =
            data.error || 'An error occurred';
          this.appendChild(errorElement);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        // Show error message
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent =
          'An error occurred while uploading';
        this.appendChild(errorElement);
      })
      .finally(() => {
        // Re-enable the button and hide the spinner
        submitButton.disabled = false;
        buttonText.textContent = 'Upload Images';
        spinner.classList.add('d-none');
      });
  });
