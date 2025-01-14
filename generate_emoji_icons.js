/**
 * 使用Canvas将emoji转换为PNG图标
 */
function generateEmojiIcon(emoji, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  ctx.font = `${size * 0.8}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size/2, size/2);
  
  return canvas.toDataURL('image/png');
}

// 使用时钟emoji: '⏰'
generateEmojiIcon('⏰', 128); 