function bboxesIntersect(b1, b2) {

  let result = true;
  // Check boundaries
  if (b1.x > b2.x + b2.width) result = false;
  if (b1.y > b2.y + b2.height) result = false;

  if (b1.x + b1.width < b2.x) result = false;
  if (b1.y + b1.height < b2.y) result = false;

  // If no boundaries crossed, bboxes overlap
  return result;

}

module.exports = bboxesIntersect