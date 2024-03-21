export const getMouseCoordinates = (
  event: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  panOffset: { x: number; y: number }
) => {
  // Get raw mouse coordinates
  const clientX = event.clientX;
  const clientY = event.clientY;

  // Adjust for pan offset
  const adjustedX = clientX - panOffset.x;
  const adjustedY = clientY - panOffset.y;

  return { clientX: adjustedX, clientY: adjustedY };
};
