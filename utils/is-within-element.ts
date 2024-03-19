import { CanvasElement } from "@/types/type";
import { distance } from "./distance";
import { nearPoint } from "./near-point";

export const positionWithinElement = (
  x: number,
  y: number,
  element: CanvasElement
) => {
  const { id, x1, x2, y1, y2, elementType } = element;
  let positionWithin;

  switch (elementType) {
    case "rectangle":
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      const topLeft = nearPoint(x, y, x1, y1, "tl");
      const topRight = nearPoint(x, y, x2, y1, "tr");
      const bottomLeft = nearPoint(x, y, x1, y2, "bl");
      const bottomRight = nearPoint(x, y, x2, y2, "br");
      const insideRect =
        x >= minX && x <= maxX && y >= minY && y <= maxY ? "inside" : null;

      positionWithin =
        topLeft || topRight || bottomLeft || bottomRight || insideRect;
      break;

    case "line":
      const a = { x: x1, y: y1 };
      const b = { x: x2, y: y2 };
      const c = { x: x, y: y };
      const offset = distance(a, b) - (distance(a, c) + distance(b, c));

      const insideLine = Math.abs(offset) < 1 ? "inside" : null;
      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      positionWithin = start || end || insideLine;
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
      const isInside =
        normalizedX * normalizedX + normalizedY * normalizedY <= 1;

      // Check if the cursor is near the border of the circle
      const isNearBorder =
        Math.abs(1 - (normalizedX * normalizedX + normalizedY * normalizedY)) <=
        1;

      positionWithin = isInside ? "inside" : isNearBorder ? "border" : null;
      break;

    default:
      break;
  }

  return positionWithin;
};
