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
  position?: string | null;
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

const nearPoint = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  name: string
) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};

const positionWithinElement = (
  x: number,
  y: number,
  element: SetElementProps
) => {
  const { tool, x1, y1, x2, y2 } = element;

  if (tool === "rectangle") {
    const topLeft = nearPoint(x, y, x1, y1, "tl");
    const topRight = nearPoint(x, y, x2, y1, "tr");
    const bottomLeft = nearPoint(x, y, x1, y2, "bl");
    const bottomRight = nearPoint(x, y, x2, y2, "br");
    const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;

    return topLeft || topRight || bottomLeft || bottomRight || inside;

    // const minX = Math.min(x1, x2);
    // const maxX = Math.max(x1, x2);
    // const minY = Math.min(y1, y2);
    // const maxY = Math.max(y1, y2);

    // return x >= minX && x <= maxX && y >= minY && y <= maxY ? "inside" : null;
  } else {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x: x, y: y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));

    const inside = Math.abs(offset) < 1 ? "inside" : null;
    const start = nearPoint(x, y, x1, y1, "start");
    const end = nearPoint(x, y, x2, y2, "end");
    return start || end || inside;
  }
};

const getElementAtPosition = (
  x: number,
  y: number,
  elements: SetElementProps[]
) => {
  return elements
    .map((element) => ({
      ...element,
      position: positionWithinElement(x, y, element),
    }))
    .find((element) => element.position !== null);
};

const adjustElementCoordinates = (element: {
  tool: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) => {
  const { tool, x1, x2, y1, y2 } = element;
  if (tool === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return { x1, y1, x2, y2 };
    } else {
      return { x1: x2, y1: y2, x2: x1, y2: y1 };
    }
  }
};

function cursorForPosition(position: string | null) {
  switch (position) {
    case "tl":
      return "nwse-resize";
    case "tr":
      return "nesw-resize";
    case "bl":
      return "nesw-resize";
    case "br":
      return "nwse-resize";
    case "start":
      return "nwse-resize";
    case "end":
      return "nesw-resize";
    case "inside":
      return "move";
    default:
      return "default";
  }
}

function resizedCoordinates(
  clientX: number,
  clientY: number,
  position: string,
  coordinates: { x1: number; y1: number; x2: number; y2: number }
) {
  const { x1, x2, y1, y2 } = coordinates;
  switch (position) {
    case "tl":
      return { x1: clientX, y1: clientY, x2, y2 };

    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1: clientX, y1, x2, y2: clientY };

    case "bl":
      return {
        x1: clientX,
        y1,
        x2,
        y2: clientY,
      };
    case "br":
    case "end":
      return { x1, x2: clientX, y1, y2: clientY };

    default:
      return null;
  }
}

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

        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
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
      setSelectedElement(element);
    }
  };

  //----------------------------------

  // MOUSE UP

  const handleMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const index = selectedElement!.id;
    const { id, tool } = elements[index];

    if (action === "drawing" || action === "resizing") {
      const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);

      updateElement(id, x1, y1, x2, y2, tool);
    }

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
      const element = getElementAtPosition(clientX, clientY, elements);
      document.body.style.cursor = element
        ? cursorForPosition(element.position)
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
    } else if (action === "resizing") {
      const { id, tool, position, ...coordinates } =
        selectedElement as SetElementProps;

      const { x1, y1, x2, y2 } = resizedCoordinates(
        clientX,
        clientY,
        position!,
        coordinates
      )!;

      updateElement(id, x1, y1, x2, y2, tool);
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
