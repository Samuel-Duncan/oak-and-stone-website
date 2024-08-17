document
  .getElementById('viewProject')
  .addEventListener('click', function (event) {
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner-border');

    // Disable the button and show the spinner
    buttonText.textContent = '';
    spinner.classList.remove('d-none');
  });
