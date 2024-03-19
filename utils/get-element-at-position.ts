import { CanvasElement } from "@/types/type";
import { positionWithinElement } from "./is-within-element";

export const getElementAtPosition = (
  x: number,
  y: number,
  elements: CanvasElement[]
) => {
  return elements
    .map((element) => ({
      ...element,
      position: positionWithinElement(x, y, element),
    }))
    .find((element) => element.position !== null);
};
