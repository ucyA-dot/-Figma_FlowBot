const { createCanvas } = require('canvas');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

function renderScene(scene) {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = '#eeeeee';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  for (const shape of scene.shapes) {
    drawShape(ctx, shape);
  }

  return canvas.toBuffer('image/png');
}

function drawShape(ctx, shape) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1e293b';
  ctx.fillStyle = shape.color || '#3b82f6';

  switch (shape.type) {
    case 'rect':
      ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
      ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'text':
      ctx.fillStyle = shape.color || '#000000';
      ctx.font = `${shape.size || 20}px sans-serif`;
      ctx.fillText(shape.content, shape.x, shape.y);
      break;
    case 'line':
      ctx.beginPath();
      ctx.moveTo(shape.x, shape.y);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.strokeStyle = shape.color || '#000000';
      ctx.stroke();
      break;
  }

  if (shape.type !== 'text') {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    const labelY = shape.y - 4 >= 8 ? shape.y - 4 : shape.y + 12;
    ctx.fillText(shape.id, shape.x + 2, labelY);
  }
}

module.exports = { renderScene, CANVAS_WIDTH, CANVAS_HEIGHT };
