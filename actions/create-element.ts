import rough from "roughjs";
import { CanvasElement } from "@/types/type";

// Init the roughjs generator
const generator = rough.generator();

/**
 *
 * Create a new element on the canvas
 *
 */
export const createElement = ({
  x1,
  y1,
  x2,
  y2,
  elementType,
}: CanvasElement) => {
  let roughElement;

  switch (elementType) {
    case "line":
      roughElement = generator.line(x1, y1, x2, y2);
      break;
    case "rectangle":
      roughElement = generator.rectangle(x1, y1, x2, y2);
      break;
    case "circle":
      roughElement = generator.ellipse(x1, y1, x2, y2, {
        // fill: "red",
      });
      break;
    case "pencil":
      break;
    default:
      throw new Error("Invalid element type");
  }

  return { x1, y1, x2, y2, roughElement, elementType };
};
