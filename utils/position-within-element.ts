import { CanvasElement, StrokePoint } from "@/types/type";
import { distance } from "./distance";
import { nearPoint } from "./near-point";
import { onLine } from "./on-line";

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
      // Check if the cursor position is within the line
      const insideLine = onLine(x1, y1, x2, y2, x, y);

      // Check if the cursor position is at the start of the line
      const start = nearPoint(x, y, x1, y1, "start");

      // Check if the cursor position is at the end of the line
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
        0.5;

      positionWithin = isInside ? "inside" : isNearBorder ? "border" : null;
      break;

    case "pencil":
      let checkStart: string | null = null;
      let checkEnd: string | null = null;

      const betweenAnyPoint = element.points?.some((point, index) => {
        if (index === 0) {
          checkStart = nearPoint(
            x,
            y,
            (point as StrokePoint).x,
            (point as StrokePoint).y,
            "start"
          );
        }

        if (index === element.points!.length - 2) {
          checkEnd = nearPoint(
            x,
            y,
            (point as StrokePoint).x,
            (point as StrokePoint).y,
            "end"
          );
        }

        const nextPoint = element.points?.[index + 1] as StrokePoint;
        if (!nextPoint) return false;
        return (
          onLine(
            (point as StrokePoint).x,
            (point as StrokePoint).y,
            nextPoint.x,
            nextPoint.y,
            x,
            y,
            5
          ) !== null
        );
      });
      positionWithin = betweenAnyPoint ? "inside" : null;

      if (checkStart === "start") {
        positionWithin = "start";
      }

      if (checkEnd === "end") {
        positionWithin = "end";
      }

      break;

    default:
      break;
  }

  return positionWithin;
};
