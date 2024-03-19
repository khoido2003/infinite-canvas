import { CanvasElement } from "@/types/type";
import { positionWithinElement } from "./is-within-element";

export const getElementAtPosition = (
  x: number,
  y: number,
  elements: CanvasElement[]
) => {
  let closestElement = null;
  let closestDistance = Infinity;

  for (const element of elements) {
    const position = positionWithinElement(x, y, element);
    if (position !== null) {
      const centerX = (element.x1 + element.x2) / 2;
      const centerY = (element.y1 + element.y2) / 2;
      const distanceToCenter = Math.sqrt(
        (x - centerX) ** 2 + (y - centerY) ** 2
      );

      // Update closest element if this one is closer
      if (distanceToCenter < closestDistance) {
        closestElement = {
          ...element,
          position: position,
        };
        closestDistance = distanceToCenter;
      }
    }
  }

  return closestElement;
};
