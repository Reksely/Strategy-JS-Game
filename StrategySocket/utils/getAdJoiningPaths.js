const fs = require('fs');
const path = require('path');
const bboxesIntersect = require('./bboxesIntersect.js')
const { JSDOM } = require('jsdom');
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../html/index.html'), 'utf8');

const { window } = new JSDOM(htmlContent, { includeNodeLocations: true });

Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
  writable: true,
  value: () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })
});

const parser = new window.DOMParser();

const doc = parser.parseFromString(htmlContent, 'text/html');

const svg = doc.querySelector('svg');



function getAdjoiningPaths(provinceId) {
  const path = svg.querySelector(`#${provinceId}`);
  const adjoiningPaths = [];
  if (path) {
    const bbox = path.getBBox();


    Object.values(svg.children).forEach(element => {

      if (element.tagName === 'path') {

        const elementBbox = element.getBBox();

        if (bboxesIntersect(bbox, elementBbox)) {
          adjoiningPaths.push(element);
        }

      }

    });
  }

  return adjoiningPaths;

}
module.exports = getAdjoiningPaths;
