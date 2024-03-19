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
  id,
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
      roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
      break;
    case "circle":
      // Calculate the center of the circle
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;

      // Calculate the radius
      const radiusX = Math.abs(x2 - x1) / 2;
      const radiusY = Math.abs(y2 - y1) / 2;

      roughElement = generator.ellipse(
        centerX,
        centerY,
        radiusX * 2,
        radiusY * 2,
        {
          roughness: 0,
        }
      );
      break;

    case "pencil":
      break;
    default:
      throw new Error("Invalid element type");
  }

  return { id, x1, y1, x2, y2, roughElement, elementType };
};
