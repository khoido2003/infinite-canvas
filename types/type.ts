// rc.circle(80, 120, 50); // centerX, centerY, diameter
// rc.ellipse(300, 100, 150, 80); // centerX, centerY, width, height
// rc.line(80, 120, 300, 100); // x1, y1, x2, y2

import { Drawable } from "roughjs/bin/core";

export enum ElementType {
  Rectangle = "rectangle",
  Line = "line",
  Circle = "circle",
  Pencil = "pencil",
}
export interface CanvasElement {
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  roughElement?: Drawable;
  elementType: ElementType;
}
