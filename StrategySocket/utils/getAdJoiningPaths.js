const fs = require('fs');
const path = require('path');
const bboxesIntersect = require('./bboxesIntersect.js')
const { JSDOM } = require('jsdom');
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../html/index.html'), 'utf8');

const { window } = new JSDOM(htmlContent, { includeNodeLocations: true });

// Parse real bounding boxes from SVG path d attributes since JSDOM doesn't support getBBox
function parseBBoxFromD(d) {
  if (!d) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let curX = 0, curY = 0;
  function addPoint(x, y) {
    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
  for (const cmd of commands) {
    const type = cmd[0];
    const nums = (cmd.slice(1).match(/-?\d+\.?\d*(?:e[+-]?\d+)?/gi) || []).map(Number);
    switch (type) {
      case 'M': curX = nums[0]; curY = nums[1]; addPoint(curX, curY);
        for (let i = 2; i < nums.length; i += 2) { curX = nums[i]; curY = nums[i+1]; addPoint(curX, curY); } break;
      case 'm': curX += nums[0]; curY += nums[1]; addPoint(curX, curY);
        for (let i = 2; i < nums.length; i += 2) { curX += nums[i]; curY += nums[i+1]; addPoint(curX, curY); } break;
      case 'L': for (let i = 0; i < nums.length; i += 2) { curX = nums[i]; curY = nums[i+1]; addPoint(curX, curY); } break;
      case 'l': for (let i = 0; i < nums.length; i += 2) { curX += nums[i]; curY += nums[i+1]; addPoint(curX, curY); } break;
      case 'H': curX = nums[0]; addPoint(curX, curY); break;
      case 'h': curX += nums[0]; addPoint(curX, curY); break;
      case 'V': curY = nums[0]; addPoint(curX, curY); break;
      case 'v': curY += nums[0]; addPoint(curX, curY); break;
      case 'C': for (let i = 0; i < nums.length; i += 6) {
        addPoint(nums[i], nums[i+1]); addPoint(nums[i+2], nums[i+3]);
        curX = nums[i+4]; curY = nums[i+5]; addPoint(curX, curY); } break;
      case 'c': for (let i = 0; i < nums.length; i += 6) {
        addPoint(curX+nums[i], curY+nums[i+1]); addPoint(curX+nums[i+2], curY+nums[i+3]);
        curX += nums[i+4]; curY += nums[i+5]; addPoint(curX, curY); } break;
      case 'S': for (let i = 0; i < nums.length; i += 4) {
        addPoint(nums[i], nums[i+1]); curX = nums[i+2]; curY = nums[i+3]; addPoint(curX, curY); } break;
      case 's': for (let i = 0; i < nums.length; i += 4) {
        addPoint(curX+nums[i], curY+nums[i+1]); curX += nums[i+2]; curY += nums[i+3]; addPoint(curX, curY); } break;
      case 'Q': for (let i = 0; i < nums.length; i += 4) {
        addPoint(nums[i], nums[i+1]); curX = nums[i+2]; curY = nums[i+3]; addPoint(curX, curY); } break;
      case 'q': for (let i = 0; i < nums.length; i += 4) {
        addPoint(curX+nums[i], curY+nums[i+1]); curX += nums[i+2]; curY += nums[i+3]; addPoint(curX, curY); } break;
      case 'A': for (let i = 0; i < nums.length; i += 7) {
        curX = nums[i+5]; curY = nums[i+6]; addPoint(curX, curY); } break;
      case 'a': for (let i = 0; i < nums.length; i += 7) {
        curX += nums[i+5]; curY += nums[i+6]; addPoint(curX, curY); } break;
      case 'Z': case 'z': break;
    }
  }
  if (minX === Infinity) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// Polyfill getBBox using path d attribute parsing
Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
  writable: true,
  value: function() {
    const d = this.getAttribute('d');
    if (d) return parseBBoxFromD(d);
    return { x: 0, y: 0, width: 0, height: 0 };
  }
});

const parser = new window.DOMParser();

const doc = parser.parseFromString(htmlContent, 'text/html');

const svg = doc.querySelector('svg');

// Pre-compute and cache bounding boxes for all paths
const bboxCache = {};
Object.values(svg.children).forEach(element => {
  if (element.tagName === 'path' && element.id) {
    bboxCache[element.id] = element.getBBox();
  }
});

function getAdjoiningPaths(provinceId) {
  const pathElement = svg.querySelector(`#${provinceId}`);
  const adjoiningPaths = [];
  if (pathElement) {
    const bbox = bboxCache[provinceId] || pathElement.getBBox();

    Object.values(svg.children).forEach(element => {
      if (element.tagName === 'path' && element !== pathElement) {
        const elementBbox = bboxCache[element.id] || element.getBBox();
        if (bboxesIntersect(bbox, elementBbox)) {
          adjoiningPaths.push(element);
        }
      }
    });
  }

  return adjoiningPaths;
}
module.exports = getAdjoiningPaths;
