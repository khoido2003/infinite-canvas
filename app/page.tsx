"use client";

import getStroke, { StrokeOptions } from "perfect-freehand";

import { HistoryState, useHistory } from "@/hooks/use-history";
import {
  TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import rough from "roughjs";
import { RoughCanvas } from "roughjs/bin/canvas";
import { Drawable } from "roughjs/bin/core";
import usePressedKeys from "@/hooks/use-pressed-key";

type StrokePoint = {
  x: number;
  y: number;
  pressure?: number | undefined;
};
export interface SetElementProps {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  offsetX?: number;
  offsetY?: number;
  xOffsets?: number[];
  yOffsets?: number[];
  text?: string;

  roughElement?: Drawable | null;
  tool: string;
  position?: string | null;
  points?: (StrokePoint | number[])[];
  options?: StrokeOptions | undefined;
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
): SetElementProps => {
  // draw line

  switch (tool) {
    case "line":
    case "rectangle":
      const roughElement =
        tool === "line"
          ? generator.line(x1, y1, x2, y2)
          : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
      return { id, x1, y1, x2, y2, roughElement, tool };

    case "pencil":
      return {
        id,
        x1,
        y1,
        x2,
        y2,

        tool,
        points: [{ x: x1, y: y1 }],
      };

    case "text":
      return { id, tool, x1, y1, x2, y2, text: "" };

    default:
      throw new Error("Invalid tool");
  }

  // draw rectangle
  // const roughElement = ;
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

const onLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
  y: number,
  maxDistance = 1
) => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x: x, y: y };
  const offset = distance(a, b) - (distance(a, c) + distance(b, c));

  return Math.abs(offset) < maxDistance ? "inside" : null;
};

const positionWithinElement = (
  x: number,
  y: number,
  element: SetElementProps
) => {
  const { tool, x1, y1, x2, y2 } = element;

  switch (tool) {
    case "line":
      const on = onLine(x1, y1, x2, y2, x, y);
      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      return start || end || on;

    case "rectangle":
      const topLeft = nearPoint(x, y, x1, y1, "tl");
      const topRight = nearPoint(x, y, x2, y1, "tr");
      const bottomLeft = nearPoint(x, y, x1, y2, "bl");
      const bottomRight = nearPoint(x, y, x2, y2, "br");
      const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;

      return topLeft || topRight || bottomLeft || bottomRight || inside;

    case "pencil":
      const betweenAnyPoint = element.points?.some((point, index) => {
        const nextPoint = element.points?.[index + 1];
        if (!nextPoint) return false;
        return (
          onLine(
            (point as StrokePoint).x,
            (point as StrokePoint).y,
            (nextPoint as StrokePoint).x,
            (nextPoint as StrokePoint).y,
            x,
            y,
            5
          ) !== null
        );
      });

      return betweenAnyPoint ? "inside" : null;

    default:
      throw new Error(`Type not recognised: ${tool}`);
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

////////////////////////////////////

const getSvgPathFromStroke = (stroke: number[][]) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};

const drawElement = (
  roughCanvas: RoughCanvas,
  context: CanvasRenderingContext2D,
  element: SetElementProps
) => {
  switch (element.tool) {
    case "line":
    case "rectangle":
      roughCanvas.draw(element.roughElement!);
      break;

    case "pencil":
      const stroke = getSvgPathFromStroke(
        getStroke(element.points!, {
          // size: 24,
          // smoothing:
        })
      );

      context.fill(new Path2D(stroke));
      break;

    case "text":
      // context.font = "24px sans-serif";
      // context.fillText(element.text!, element.x1, element.y1);
      break;
    default:
      throw new Error(`Type not recognised: ${element.tool}`);
  }
};

const adjustmentRequired = (tool: string) =>
  ["line", "rectangle"].includes(tool);

/////////////////////////////////

export default function Home() {
  //Panning
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPanMousePosition, setStartPanMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const pressedKeys = usePressedKeys();

  // Zoom in and out
  const [scale, setScale] = useState(1);
  const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });

  const [elements, setElement, undo, redo] = useHistory([]);
  const [action, setAction] = useState<string | boolean>("");
  const [tool, setTool] = useState("rectangle");
  const [selectedElement, setSelectedElement] =
    useState<null | SetElementProps>(null);

  // const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const onZoom = useCallback(
    (delta: number) => {
      // Define the zoom step
      const zoomStep = delta > 0 ? 0.1 : -0.1;

      // Calculate the new scale factor
      const newScale = scale + zoomStep;

      // Define the minimum and maximum scale factors
      const minScale = 0.1;
      const maxScale = 10;

      // Ensure the new scale factor stays within the defined range
      const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);

      // Update the scale state
      setScale(clampedScale);
    },
    [scale]
  );

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    const roughCanvas = rough.canvas(canvas);

    // Clear canvas
    context?.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scaled dimensions and offset
    const scaleWidth = canvas.width * scale;
    const scaleHeight = canvas.height * scale;

    const scaleOffsetX = (scaleWidth - canvas.width) / 2;
    const scaleOffsetY = (scaleHeight - canvas.height) / 2;
    setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY });

    // Save current context state
    context?.save();

    // Apply translation and scaling
    context?.translate(
      panOffset.x * scale - scaleOffsetX,
      panOffset.y * scale - scaleOffsetY
    );
    context?.scale(scale, scale);

    // Draw elements
    elements.forEach((element) => {
      drawElement(roughCanvas, context!, element);
    });

    // Restore previous context state
    context?.restore();
  }, [elements, panOffset, scale]);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      switch (e.key) {
        // case "Backspace":
        //   deleteLayers();
        //   break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            undo();
            break;
          }
        case "y":
          if (e.ctrlKey || e.metaKey) {
            redo();
            break;
          }
      }
    }

    document.addEventListener("keydown", onKeydown);

    return () => {
      document.removeEventListener("keydown", onKeydown);
    };
  }, [undo, redo]);

  useEffect(() => {
    const panOrZoomFunction = (event: WheelEvent) => {
      if (pressedKeys.has("Meta") || pressedKeys.has("Control")) {
        event.preventDefault(); // Prevent default zoom behavior
        const zoomFactor = event.deltaY > 0 ? 0 - 1 : 0.1; // Adjust the zoom factor as desired
        onZoom(zoomFactor);
      } else {
        setPanOffset((prev) => ({
          x: prev.x - event.deltaX,
          y: prev.y - event.deltaY,
        }));
      }
    };

    document.addEventListener("wheel", panOrZoomFunction, { passive: false });
    return () => {
      document.removeEventListener("wheel", panOrZoomFunction);
    };
  }, [pressedKeys, onZoom]);

  //-------------------------------
  // MOUSE DOWN

  const getMouseCoordinates = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    // Get raw mouse coordinates
    const clientX =
      (event.clientX - panOffset.x * scale + scaleOffset.x) / scale;
    const clientY =
      (event.clientY - panOffset.y * scale + scaleOffset.y) / scale;

    // Adjust for pan offset
    const adjustedX = clientX - panOffset.x;
    const adjustedY = clientY - panOffset.y;

    return { clientX: adjustedX, clientY: adjustedY };
  };

  const handleMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (action === "writing") {
      return;
    }

    // const { clientX, clientY } = event;
    const { clientX, clientY } = getMouseCoordinates(event);

    if (event.button === 1 || pressedKeys.has(" ")) {
      setAction("panning");
      setStartPanMousePosition({ x: clientX, y: clientY });
    }

    if (tool === "selection") {
      // If we are on an element
      // setAction(moving)

      const element = getElementAtPosition(clientX, clientY, elements);

      if (element) {
        if (element.tool === "pencil") {
          const xOffsets = element.points!.map(
            (point) => clientX - (point as StrokePoint).x
          );
          const yOffsets = element.points!.map(
            (point) => clientY - (point as StrokePoint).y
          );
          setSelectedElement({ ...element, xOffsets, yOffsets });
        } else {
          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;
          setSelectedElement({ ...element, offsetX, offsetY });
        }

        setElement((prevState: HistoryState) => prevState);

        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      }
    } else {
      const id = elements.length;
      const { clientX, clientY } = getMouseCoordinates(event);
      const element = createElement(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        tool
      );
      setElement((prev: HistoryState) => [...prev, element]);
      setSelectedElement(element);
      setAction(tool === "text" ? "writing" : "drawing");
    }
  };

  //----------------------------------

  // MOUSE UP

  const handleMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const { clientX, clientY } = getMouseCoordinates(event);

    if (selectedElement) {
      const index = selectedElement!.id;
      const { id, tool } = elements[index];

      if (
        (action === "drawing" || action === "resizing") &&
        adjustmentRequired(tool)
      ) {
        const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);

        updateElement(id, x1, y1, x2, y2, tool);
      }
    }

    if (action === "writing") {
      return;
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
    const elementsCopy = [...elements];

    switch (tool) {
      case "line":
      case "rectangle":
        elementsCopy[id] = createElement(id, x1, y1, x2, y2, tool);
        break;
      case "pencil":
        elementsCopy[id].points = [
          ...elementsCopy[id].points!,
          { x: x2, y: y2 },
        ];
        break;
      default:
        throw new Error(`Invalid tool: "${tool}".`);
    }
    setElement(elementsCopy, true);
  };

  const handleMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const { clientX, clientY } = getMouseCoordinates(event);

    if (action === "panning") {
      const deltaX = clientX - startPanMousePosition.x;
      const deltaY = clientY - startPanMousePosition.y;
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      return;
    }

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
      if (selectedElement!.tool === "pencil") {
        const { id } = selectedElement as SetElementProps;
        const newPoints = selectedElement?.points!.map((point, index) => {
          return {
            x: clientX - selectedElement.xOffsets![index],
            y: clientY - selectedElement.yOffsets![index],
          };
        });

        const elementsCopy = [...elements];

        elementsCopy[id] = {
          ...elementsCopy[id],
          points: newPoints,
        };

        setElement(elementsCopy, true);
      } else {
        const { id, x1, x2, y1, y2, tool, offsetX, offsetY } =
          selectedElement as SetElementProps;

        const width = x2 - x1;
        const height = y2 - y1;

        const newX1 = clientX - offsetX!;
        const newY1 = clientY - offsetY!;

        updateElement(id, newX1, newY1, newX1 + width, newY1 + height, tool);
      }
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
      <div style={{ position: "fixed", zIndex: 2 }}>
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

        <input
          type="radio"
          id="pencil"
          checked={tool === "pencil"}
          onChange={() => setTool("pencil")}
        />
        <label htmlFor="pencil">Pencil</label>
      </div>

      <div style={{ position: "fixed", bottom: 0, padding: 10, zIndex: 2 }}>
        <button
          onClick={() => {
            undo();
          }}
          className="bg-slate-500 mr-3 p-3 text-white rounded-md"
        >
          Undo
        </button>
        <button
          className="bg-slate-500 mr-3 p-3 text-white rounded-md"
          onClick={() => {
            redo();
          }}
        >
          Redo
        </button>

        <span className="mr-4"></span>

        <button
          className="bg-slate-500 mr-3 p-3 text-white rounded-md"
          onClick={() => onZoom(-0.1)}
        >
          -
        </button>
        <button
          className="bg-slate-500 mr-3 p-3 text-white rounded-md"
          onClick={() => setScale(1)}
        >
          {`${new Intl.NumberFormat("en-GB", { style: "percent" }).format(
            scale
          )}`}
        </button>
        <button
          className="bg-slate-500 mr-3 p-3 text-white rounded-md"
          onClick={() => onZoom(0.1)}
        >
          +
        </button>
      </div>

      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ position: "absolute", zIndex: 1 }}
      >
        Canvas
      </canvas>
    </div>
  );
}
