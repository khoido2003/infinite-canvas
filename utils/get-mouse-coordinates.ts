export const getMouseCoordinates = (
  event: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  panOffset: { x: number; y: number },
  scale: number,
  scaleOffset: { x: number; y: number }
) => {
  // Get raw mouse coordinates
  const clientX = (event.clientX - panOffset.x * scale + scaleOffset.x) / scale;
  const clientY = (event.clientY - panOffset.y * scale + scaleOffset.y) / scale;

  // Adjust for pan offset
  const adjustedX = clientX - panOffset.x;
  const adjustedY = clientY - panOffset.y;

  return { clientX: adjustedX, clientY: adjustedY };
};
