import { CanvasElement } from "@/types/type";
import { distance } from "./distance";

export const isWithinElement = (
  x: number,
  y: number,
  element: CanvasElement
) => {
  const { id, x1, x2, y1, y2, elementType } = element;
  let isWithin;

  switch (elementType) {
    case "rectangle":
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      isWithin = x >= minX && x <= maxX && y >= minY && y <= maxY;
      console.log(isWithin);
      break;

    case "line":
      const a = { x: x1, y: y1 };
      const b = { x: x2, y: y2 };
      const c = { x: x, y: y };
      const offset = distance(a, b) - (distance(a, c) + distance(b, c));
      isWithin = Math.abs(offset) < 1;
      break;

    case "circle":
      const radiusX = Math.abs(x1 - x2) / 2;
      const radiusY = Math.abs(y1 - y2) / 2;
      const centerX = Math.min(x1, x2) + radiusX;
      const centerY = Math.min(y1, y2) + radiusY;

      // Calculate normalized coordinates
      const normalizedX = (x - centerX) / radiusX;
      const normalizedY = (y - centerY) / radiusY;

      // Check if the point is inside the circle
      isWithin = normalizedX * normalizedX + normalizedY * normalizedY <= 1;
      break;

    default:
      break;
  }

  return isWithin;
};
