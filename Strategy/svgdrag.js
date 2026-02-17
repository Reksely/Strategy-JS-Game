const svgContainer = document.querySelector('#svg1');
let isDragging = false;
let startPoint;
const originalViewBox = svgContainer.getAttribute('viewBox');
let currentViewBox = originalViewBox;
let scrollableHeight;
const infoContainer = document.querySelector('#info-container');

function printViewBox() {
  const currentViewBox = svgContainer.getAttribute('viewBox');
  console.log(`Current viewBox: ${currentViewBox}`);
}

// Call the function initially to get the current value
//printViewBox();

// Set an interval to print the value every 5 seconds
//setInterval(printViewBox, 5000); //

// Disable right-click
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

// Remove zoom for info container
infoContainer.addEventListener('wheel', e => {
  e.preventDefault();
});

// Fix zooming in and out for map
svgContainer.addEventListener('mousedown', e => {
  isDragging = true;
  startPoint = { x: e.clientX, y: e.clientY };
});

svgContainer.addEventListener('mouseup', () => {
  isDragging = false;
});

svgContainer.addEventListener('mousemove', e => {
  if (isDragging) {
    requestAnimationFrame(() => {
      const currentPoint = { x: e.clientX, y: e.clientY };
      const deltaX = currentPoint.x - startPoint.x;
      const deltaY = currentPoint.y - startPoint.y;
      currentViewBox = `${parseFloat(currentViewBox.split(' ')[0]) - deltaX} ${parseFloat(currentViewBox.split(' ')[1]) - deltaY} ${currentViewBox.split(' ')[2]} ${currentViewBox.split(' ')[3]}`;
      svgContainer.setAttribute('viewBox', currentViewBox);
      startPoint = currentPoint;
    });
  }
});

svgContainer.addEventListener('wheel', e => {
  if (e.ctrlKey) {
    e.preventDefault();
    const zoomAmount = e.deltaY > 0 ? 1.1 : 0.9;
    const viewBox = currentViewBox.split(' ');
    const viewBoxWidth = parseFloat(viewBox[2]);
    const viewBoxHeight = parseFloat(viewBox[3]);
    const mouseX = e.clientX - svgContainer.getBoundingClientRect().left;
    const mouseY = e.clientY - svgContainer.getBoundingClientRect().top;
    const newViewBoxWidth = viewBoxWidth * zoomAmount;
    const newViewBoxHeight = viewBoxHeight * zoomAmount;
    const minX = 0;
    const minY = 0;
    const maxX = parseFloat(originalViewBox.split(' ')[2]) - newViewBoxWidth;
    const maxY = parseFloat(originalViewBox.split(' ')[3]) - newViewBoxHeight;
    const viewBoxX = Math.min(Math.max(parseFloat(viewBox[0]) - (newViewBoxWidth - viewBoxWidth) * (mouseX / svgContainer.clientWidth), minX), maxX);
    const viewBoxY = Math.min(Math.max(parseFloat(viewBox[1]) - (newViewBoxHeight - viewBoxHeight) * (mouseY / svgContainer.clientHeight), minY), maxY);

    const newViewBox = `${viewBoxX} ${viewBoxY} ${newViewBoxWidth} ${newViewBoxHeight}`;
    if (newViewBoxWidth > parseFloat(originalViewBox.split(' ')[2])) {
      return; // Ignore zooming out beyond default size
    }

    currentViewBox = newViewBox;
    svgContainer.setAttribute('viewBox', currentViewBox);

    scrollableHeight = Math.max(viewBoxHeight - svgContainer.clientHeight, 0);
  }
});

svgContainer.addEventListener('scroll', () => {
  if (currentViewBox !== originalViewBox) {
    const scrollTop = svgContainer.scrollTop;
    const viewBox = currentViewBox.split(' ');
    const minY = 0;
    const maxY = scrollableHeight;
    const viewBoxY = Math.min(Math.max(parseFloat(viewBox[1]) - (scrollableHeight * (scrollTop / svgContainer.clientHeight)), minY), maxY);

    currentViewBox = `${viewBox[0]} ${viewBoxY} ${viewBox[2]} ${viewBox[3]}`;
    svgContainer.setAttribute('viewBox', currentViewBox);
  }
});