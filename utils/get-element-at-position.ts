import { CanvasElement } from "@/types/type";
import { isWithinElement } from "./is-within-element";

export const getElementAtPosition = (
  x: number,
  y: number,
  elements: CanvasElement[]
) => {
  return elements.find((element) => isWithinElement(x, y, element));
};
