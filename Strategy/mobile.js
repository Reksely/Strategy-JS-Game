

function checkOrientation() {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
console.log(screenWidth < screenHeight)
    if (screenWidth < screenHeight) {
      const message = document.querySelector('.rotate-message');
      if (!message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = 'Please rotate your phone to landscape mode to play.';
        messageElement.classList.add('rotate-message');
        messageElement.style.position = 'fixed';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.fontSize = '24px';
        messageElement.style.textAlign = 'center';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        messageElement.style.color = '#fff';
        messageElement.style.padding = '10px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.filter = 'none'; // Set no blur on the message itself

        document.body.appendChild(messageElement);
       // document.body.style.filter = 'blur(5px)'; // Blur the background
        document.body.style.pointerEvents = 'none';
      }
    } else {


      let initialScale = 0.5; // Adjust the initial scale value as needed

      document.addEventListener('DOMContentLoaded', function() {
        embed.style.transformOrigin = 'center center';
        embed.style.transform = `scale(${initialScale})`;
      });

      const message = document.querySelector('.rotate-message');
      if (message) {
        const parent = message.parentNode;
        parent.removeChild(message);
        console.log('removes')
      }
      else {
        console.log("no message")
      }

      document.body.style.filter = 'none'; // Remove blur from the background
      document.body.style.pointerEvents = 'auto';


    }
  }
}

// Check orientation on page load
//checkOrientation();

// Check orientation when the window is resized
//window.addEventListener('resize', checkOrientation);
//window.addEventListener('orientationchange', checkOrientation);

// zoom

// Check if the user is on a mobile device


// Block zooming on mobile devices except for the specified element
