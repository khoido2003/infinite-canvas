import { CanvasElement } from "@/types/type";

export const resizeDrawFreehand = (
  elements: CanvasElement[],
  element: CanvasElement,
  clientX: number,
  clientY: number,
  setElements: (action: any, overwrite?: boolean) => void
) => {
  const { id, points } = element;

  // Find the minimum and maximum x and y coordinates of the points
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  points?.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  // Calculate the original width and height of the element
  const originalWidth = maxX - minX;
  const originalHeight = maxY - minY;

  // Calculate the scaling factors for resizing
  const scaleX = (clientX - minX) / originalWidth;
  const scaleY = (clientY - minY) / originalHeight;

  // Adjust the coordinates of each point in the stroke path

  const newPoints = points?.map((point) => {
    // (point.x - minX): This calculates the distance of the point's x-coordinate from the left edge of the original bounding box.

    // (point.x - minX) * scaleX: This scales the distance calculated in step 1 by the scaleX factor, which effectively stretches or compresses the distance based on the change in width.

    // minX + (point.x - minX) * scaleX: This adds the scaled distance back to the left edge of the original bounding box, resulting in the new x-coordinate for the point.
    return {
      x: minX + (point.x - minX) * scaleX,
      y: minY + (point.y - minY) * scaleY,
      pressure: point.pressure, // Preserve pressure if available
    };
  });

  // Update the element's points and set the new element in the array
  const elementsCopy = [...elements];
  elementsCopy[id] = {
    ...element,
    points: newPoints,
  };

  setElements(elementsCopy, true);
};
