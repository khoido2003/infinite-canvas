"use client";

import { useLayoutEffect, useState } from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";

interface SetElementProps {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  offsetX?: number;
  offsetY?: number;
  roughElement: Drawable;
  tool: string;
}

const generator = rough.generator();

///////////////////////////////////////////

// Drawing element
const createElement = (
  id: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tool: string
) => {
  // draw line
  const roughElement =
    tool === "line"
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);

  // draw rectangle
  // const roughElement = ;

  return { id, x1, y1, x2, y2, roughElement, tool };
};

//////////////////////////////////

// Select element

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

const isWithinElement = (x: number, y: number, element: SetElementProps) => {
  const { tool, x1, y1, x2, y2 } = element;

  if (tool === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  } else {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x: x, y: y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));

    return Math.abs(offset) < 1;
  }
};

const getElementAtPosition = (
  x: number,
  y: number,
  elements: SetElementProps[]
) => {
  return elements.find((el) => isWithinElement(x, y, el));
};

/////////////////////////////////

export default function Home() {
  const [elements, setElement] = useState<SetElementProps[]>([]);
  const [action, setAction] = useState<string | boolean>("");
  const [tool, setTool] = useState("line");
  const [selectedElement, setSelectedElement] =
    useState<null | SetElementProps>(null);

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

  //-------------------------------
  // MOUSE DOWN

  const handleMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const { clientX, clientY } = event;

    if (tool === "selection") {
      // If we are on an element
      // setAction(moving)

      const element = getElementAtPosition(clientX, clientY, elements);

      if (element) {
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;

        setSelectedElement({ ...element, offsetX, offsetY });
        setAction("moving");
      }
    } else {
      const id = elements.length;
      const { clientX, clientY } = event;
      const element = createElement(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        tool
      );
      setAction("drawing");
      setElement((prev) => [...prev, element]);
    }
  };

  //----------------------------------

  // MOUSE UP

  const handleMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setAction("none");
    setSelectedElement(null);
  };

  // ----------------------------------------
  // MOUSE MOVE

  const updateElement = (
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tool: string
  ) => {
    const updatedElement = createElement(id, x1, y1, x2, y2, tool);

    const elementsCopy = [...elements];
    elementsCopy[id] = updatedElement;
    setElement(elementsCopy);
  };

  const handleMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const { clientX, clientY } = event;

    if (tool === "selection") {
      document.body.style.cursor = getElementAtPosition(
        clientX,
        clientY,
        elements
      )
        ? "move"
        : "default";
    }

    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];

      updateElement(index, x1, y1, clientX, clientY, tool);
    } else if (action === "moving") {
      const { id, x1, x2, y1, y2, tool, offsetX, offsetY } =
        selectedElement as SetElementProps;

      const width = x2 - x1;
      const height = y2 - y1;

      const newX1 = clientX - offsetX!;
      const newY1 = clientY - offsetY!;

      updateElement(id, newX1, newY1, newX1 + width, newY1 + height, tool);
    }
  };

  return (
    <div>
      <div style={{ position: "fixed" }}>
        <input
          type="radio"
          id="selection"
          checked={tool === "selection"}
          onChange={() => setTool("selection")}
        />
        <label htmlFor="selection">Selection</label>
        <input
          type="radio"
          id="line"
          checked={tool === "line"}
          onChange={() => setTool("line")}
        />
        <label htmlFor="line">Line</label>
        <input
          type="radio"
          id="rectangle"
          checked={tool === "rectangle"}
          onChange={() => setTool("rectangle")}
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
