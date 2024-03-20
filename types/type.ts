// rc.circle(80, 120, 50); // centerX, centerY, diameter
// rc.ellipse(300, 100, 150, 80); // centerX, centerY, width, height
// rc.line(80, 120, 300, 100); // x1, y1, x2, y2

import { StrokeOptions } from "perfect-freehand";
import { Drawable } from "roughjs/bin/core";

export enum ElementType {
  Selection = "selection",
  Rectangle = "rectangle",
  Line = "line",
  Circle = "circle",
  Pencil = "pencil",
}
export interface CanvasElement {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  offsetX?: number;
  offsetY?: number;

  xOffsets?: number[];
  yOffsets?: number[];

  roughElement?: Drawable;
  elementType: ElementType;
  position?: string | null;
  points?: (StrokePoint | number[])[];
  options?: StrokeOptions | undefined;
}

// Drawing with freehand
export type StrokePoint = {
  x: number;
  y: number;
  pressure?: number | undefined;
};
