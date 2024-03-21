import { CanvasElement } from "@/types/type";
import { getSvgPathFromStroke } from "@/utils/get-svg-path-from-stroke";
import getStroke from "perfect-freehand";
import { RoughCanvas } from "roughjs/bin/canvas";

export const drawElement = (
  roughCanvas: RoughCanvas,
  context: CanvasRenderingContext2D,
  element: CanvasElement,
  size: number = 6
) => {
  switch (element.elementType) {
    case "line":
    case "rectangle":
    case "circle":
      roughCanvas.draw(element.roughElement!);
      break;

    case "pencil":
      const stroke = getSvgPathFromStroke(
        getStroke(element.points!, {
          size: size,
        })
      );
      context.fill(new Path2D(stroke));
      break;
    case "erase":
      break;
    default:
      // throw new Error("Invalid element type");
      break;
  }
};
