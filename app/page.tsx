"use client";

import { useLayoutEffect, useState } from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";

interface SetElementProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  roughElement: Drawable;
  elementType: string;
}

const generator = rough.generator();

const createElement = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  elementType: string
) => {
  // draw line
  const roughElement =
    elementType === "line"
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);

  // draw rectangle
  // const roughElement = ;

  return { x1, y1, x2, y2, roughElement, elementType };
};

export default function Home() {
  const [elements, setElement] = useState<SetElementProps[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [elementType, setElementType] = useState("line");

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);
    // const ctx = canvas.getContext("2d");
    // ctx!.fillStyle = "green";
    // ctx!.fillRect(10, 10, 150, 100);
    // ctx?.strokeRect(0, 0, 150, 100);

    // const rect = roughCanvas.rectangle(10, 10, 100, 100);
    // const line = generator.line(10, 10, 110, 110);
    // roughCanvas.draw(rect);
    // roughCanvas.draw(line);

    elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
  }, [elements]);

  const handleMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setDrawing(true);
    const { clientX, clientY } = event;
    const element = createElement(
      clientX,
      clientY,
      clientX,
      clientY,
      elementType
    );
    setElement((prev) => [...prev, element]);
  };

  const handleMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setDrawing(false);
  };

  const handleMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (!drawing) return;
    const { clientX, clientY } = event;
    const index = elements.length - 1;
    const { x1, y1 } = elements[index];
    const updatedElement = createElement(x1, y1, clientX, clientY, elementType);

    const elementsCopy = [...elements];
    elementsCopy[index] = updatedElement;
    setElement(elementsCopy);
  };

  return (
    <div>
      <div style={{ position: "fixed" }}>
        <input
          type="radio"
          id="line"
          checked={elementType === "line"}
          onChange={() => setElementType("line")}
        />
        <label htmlFor="line">Line</label>
        <input
          type="radio"
          id="rectangle"
          checked={elementType === "rectangle"}
          onChange={() => setElementType("rectangle")}
        />
        <label htmlFor="rectangle">Rectangle</label>
      </div>
      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        Hello
      </canvas>
    </div>
  );
}
