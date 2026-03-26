/**
 * One-time script to extract SVG map data into JSON for the Phaser game.
 * Run: node extractMapData.js
 * Output: Strategy/mapdata.json
 */
const { JSDOM } = require('./StrategySocket/node_modules/jsdom');
const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.resolve(__dirname, 'StrategySocket/html/index.html'), 'utf8');
const { window } = new JSDOM(htmlContent);
const doc = new window.DOMParser().parseFromString(htmlContent, 'text/html');
const svg = doc.querySelector('svg');

// --- SVG Path Parser ---

function cubicBezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
}

function quadraticBezier(t, p0, p1, p2) {
  const u = 1 - t;
  return u*u*p0 + 2*u*t*p1 + t*t*p2;
}

function parseSVGPath(d) {
  if (!d) return [];

  const points = [];
  let curX = 0, curY = 0;
  let startX = 0, startY = 0;
  let lastCX = 0, lastCY = 0; // last control point for S/T
  let lastCmd = '';
  const SEGMENTS = 3;

  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];

  for (const cmd of commands) {
    const type = cmd[0];
    const nums = (cmd.slice(1).match(/-?\d+\.?\d*(?:e[+-]?\d+)?/gi) || []).map(Number);

    switch (type) {
      case 'M':
        curX = nums[0]; curY = nums[1];
        startX = curX; startY = curY;
        points.push([curX, curY]);
        for (let i = 2; i < nums.length; i += 2) {
          curX = nums[i]; curY = nums[i+1];
          points.push([curX, curY]);
        }
        break;
      case 'm':
        curX += nums[0]; curY += nums[1];
        startX = curX; startY = curY;
        points.push([curX, curY]);
        for (let i = 2; i < nums.length; i += 2) {
          curX += nums[i]; curY += nums[i+1];
          points.push([curX, curY]);
        }
        break;
      case 'L':
        for (let i = 0; i < nums.length; i += 2) {
          curX = nums[i]; curY = nums[i+1];
          points.push([curX, curY]);
        }
        break;
      case 'l':
        for (let i = 0; i < nums.length; i += 2) {
          curX += nums[i]; curY += nums[i+1];
          points.push([curX, curY]);
        }
        break;
      case 'H':
        for (const n of nums) { curX = n; points.push([curX, curY]); }
        break;
      case 'h':
        for (const n of nums) { curX += n; points.push([curX, curY]); }
        break;
      case 'V':
        for (const n of nums) { curY = n; points.push([curX, curY]); }
        break;
      case 'v':
        for (const n of nums) { curY += n; points.push([curX, curY]); }
        break;
      case 'C':
        for (let i = 0; i < nums.length; i += 6) {
          const x1=nums[i], y1=nums[i+1], x2=nums[i+2], y2=nums[i+3], x=nums[i+4], y=nums[i+5];
          for (let s = 1; s <= SEGMENTS; s++) {
            const t = s / SEGMENTS;
            points.push([cubicBezier(t, curX, x1, x2, x), cubicBezier(t, curY, y1, y2, y)]);
          }
          lastCX = x2; lastCY = y2;
          curX = x; curY = y;
        }
        break;
      case 'c':
        for (let i = 0; i < nums.length; i += 6) {
          const x1=curX+nums[i], y1=curY+nums[i+1], x2=curX+nums[i+2], y2=curY+nums[i+3];
          const x=curX+nums[i+4], y=curY+nums[i+5];
          for (let s = 1; s <= SEGMENTS; s++) {
            const t = s / SEGMENTS;
            points.push([cubicBezier(t, curX, x1, x2, x), cubicBezier(t, curY, y1, y2, y)]);
          }
          lastCX = x2; lastCY = y2;
          curX = x; curY = y;
        }
        break;
      case 'S':
        for (let i = 0; i < nums.length; i += 4) {
          const x1 = (lastCmd === 'C' || lastCmd === 'c' || lastCmd === 'S' || lastCmd === 's')
            ? 2*curX - lastCX : curX;
          const y1 = (lastCmd === 'C' || lastCmd === 'c' || lastCmd === 'S' || lastCmd === 's')
            ? 2*curY - lastCY : curY;
          const x2=nums[i], y2=nums[i+1], x=nums[i+2], y=nums[i+3];
          for (let s = 1; s <= SEGMENTS; s++) {
            const t = s / SEGMENTS;
            points.push([cubicBezier(t, curX, x1, x2, x), cubicBezier(t, curY, y1, y2, y)]);
          }
          lastCX = x2; lastCY = y2;
          curX = x; curY = y;
        }
        break;
      case 's':
        for (let i = 0; i < nums.length; i += 4) {
          const x1 = (lastCmd === 'C' || lastCmd === 'c' || lastCmd === 'S' || lastCmd === 's')
            ? 2*curX - lastCX : curX;
          const y1 = (lastCmd === 'C' || lastCmd === 'c' || lastCmd === 'S' || lastCmd === 's')
            ? 2*curY - lastCY : curY;
          const x2=curX+nums[i], y2=curY+nums[i+1], x=curX+nums[i+2], y=curY+nums[i+3];
          for (let s = 1; s <= SEGMENTS; s++) {
            const t = s / SEGMENTS;
            points.push([cubicBezier(t, curX, x1, x2, x), cubicBezier(t, curY, y1, y2, y)]);
          }
          lastCX = x2; lastCY = y2;
          curX = x; curY = y;
        }
        break;
      case 'Q':
        for (let i = 0; i < nums.length; i += 4) {
          const x1=nums[i], y1=nums[i+1], x=nums[i+2], y=nums[i+3];
          for (let s = 1; s <= SEGMENTS; s++) {
            const t = s / SEGMENTS;
            points.push([quadraticBezier(t, curX, x1, x), quadraticBezier(t, curY, y1, y)]);
          }
          lastCX = x1; lastCY = y1;
          curX = x; curY = y;
        }
        break;
      case 'q':
        for (let i = 0; i < nums.length; i += 4) {
          const x1=curX+nums[i], y1=curY+nums[i+1], x=curX+nums[i+2], y=curY+nums[i+3];
          for (let s = 1; s <= SEGMENTS; s++) {
            const t = s / SEGMENTS;
            points.push([quadraticBezier(t, curX, x1, x), quadraticBezier(t, curY, y1, y)]);
          }
          lastCX = x1; lastCY = y1;
          curX = x; curY = y;
        }
        break;
      case 'T':
        for (let i = 0; i < nums.length; i += 2) {
          const cx = (lastCmd === 'Q' || lastCmd === 'q' || lastCmd === 'T' || lastCmd === 't')
            ? 2*curX - lastCX : curX;
          const cy = (lastCmd === 'Q' || lastCmd === 'q' || lastCmd === 'T' || lastCmd === 't')
            ? 2*curY - lastCY : curY;
          const x=nums[i], y=nums[i+1];
          for (let s = 1; s <= SEGMENTS; s++) {
            const t = s / SEGMENTS;
            points.push([quadraticBezier(t, curX, cx, x), quadraticBezier(t, curY, cy, y)]);
          }
          lastCX = cx; lastCY = cy;
          curX = x; curY = y;
        }
        break;
      case 't':
        for (let i = 0; i < nums.length; i += 2) {
          const cx = (lastCmd === 'Q' || lastCmd === 'q' || lastCmd === 'T' || lastCmd === 't')
            ? 2*curX - lastCX : curX;
          const cy = (lastCmd === 'Q' || lastCmd === 'q' || lastCmd === 'T' || lastCmd === 't')
            ? 2*curY - lastCY : curY;
          const x=curX+nums[i], y=curY+nums[i+1];
          for (let s = 1; s <= SEGMENTS; s++) {
            const t = s / SEGMENTS;
            points.push([quadraticBezier(t, curX, cx, x), quadraticBezier(t, curY, cy, y)]);
          }
          lastCX = cx; lastCY = cy;
          curX = x; curY = y;
        }
        break;
      case 'A': case 'a': {
        // Approximate arcs as straight lines to endpoint
        const step = type === 'A' ? 7 : 7;
        for (let i = 0; i < nums.length; i += step) {
          if (type === 'A') {
            curX = nums[i+5]; curY = nums[i+6];
          } else {
            curX += nums[i+5]; curY += nums[i+6];
          }
          points.push([curX, curY]);
        }
        break;
      }
      case 'Z': case 'z':
        curX = startX; curY = startY;
        break;
    }
    lastCmd = type;
  }

  return points;
}

// --- Douglas-Peucker point simplification ---
function perpendicularDist(pt, lineStart, lineEnd) {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const lenSq = dx*dx + dy*dy;
  if (lenSq === 0) return Math.hypot(pt[0]-lineStart[0], pt[1]-lineStart[1]);
  let t = ((pt[0]-lineStart[0])*dx + (pt[1]-lineStart[1])*dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(pt[0]-(lineStart[0]+t*dx), pt[1]-(lineStart[1]+t*dy));
}

function simplify(points, epsilon) {
  if (points.length <= 2) return points;
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], points[0], points[points.length-1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = simplify(points.slice(0, maxIdx+1), epsilon);
    const right = simplify(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length-1]];
}

// --- Extract all provinces ---

const viewBoxStr = svg.getAttribute('viewBox');
const vb = viewBoxStr.split(/\s+/).map(Number);
const viewBox = { x: vb[0], y: vb[1], width: vb[2], height: vb[3] };

const provinces = {};
let count = 0;

svg.querySelectorAll('path').forEach(pathEl => {
  const id = pathEl.getAttribute('id');
  const d = pathEl.getAttribute('d');
  const country = pathEl.getAttribute('data-country') || null;

  if (!id || !d) return;

  let points = parseSVGPath(d);
  if (points.length < 3) return;

  // Simplify with Douglas-Peucker (epsilon=0.3 keeps good detail for a map)
  points = simplify(points, 0.3);
  if (points.length < 3) return;

  // Compute bounding box and center
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }

  // Flatten to [x1,y1,x2,y2,...] and round to 1 decimal
  const flat = [];
  for (const [x, y] of points) {
    flat.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }

  provinces[id] = {
    p: flat,
    c: country,
    cx: Math.round((minX + maxX) / 2 * 10) / 10,
    cy: Math.round((minY + maxY) / 2 * 10) / 10
  };
  count++;
});

const mapData = { viewBox, provinces };

const outPath = path.resolve(__dirname, 'Strategy/mapdata.json');
fs.writeFileSync(outPath, JSON.stringify(mapData));

console.log(`Extracted ${count} provinces to ${outPath}`);
console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(0)}KB`);
