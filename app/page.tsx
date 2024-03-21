"use client";

import rough from "roughjs";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { throttle } from "lodash";

import { CanvasElement, ElementType, StrokePoint } from "@/types/type";
import { createElement } from "@/actions/create-element";
import { getElementAtPosition } from "@/utils/get-element-at-position";
import { cursorForPosition } from "@/utils/cursor-for-position";
import { resizeCoordinates } from "@/utils/resize-coordinates";
import { HistoryState, useHistory } from "@/hooks/use-history";
import { drawElement } from "@/actions/draw-element";
import { resizeDrawFreehand } from "@/utils/resize-draw-freehand";
import { getMouseCoordinates } from "@/utils/get-mouse-coordinates";
import usePressedKeys from "@/hooks/use-pressed-key";

const Home = () => {
  // HOOKS

  // Type of the element: rectangle, line, pencil, circle
  const [elementType, setElementType] = useState<ElementType>(
    () => ElementType.Rectangle
  );

  // Check if drawing or not
  const [action, setAction] = useState<
    "moving" | "drawing" | "none" | "resizing" | "panning"
  >("none");

  // List of elements on the canvas
  // const [elements, setElements] = useState<CanvasElement[] | []>([]);
  const { elements, redo, setState: setElements, undo } = useHistory([]);

  // The element currently being drawn or selected
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(
    null
  );

  const [penSize, setPenSize] = useState(6);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Create Pan offset
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPanMousePosition, setStartPanMousePosition] = useState({
    x: 0,
    y: 0,
  });

  // Zoom in/out in canvas
  const [scale, setScale] = useState(1);
  const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });

  const pressedKeys = usePressedKeys();

  //-------------------------------

  useLayoutEffect(() => {
    // Setup the canvas
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    // representing a two-dimensional rendering context.
    const context = canvas.getContext("2d");

    // Linking roughjs to html canvas
    const roughCanvas = rough.canvas(canvas);

    // Erase the whole canvas or else the old element or old state will still be there and causing some weird behaviors.
    context?.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate the scaled dimension and offset
    const scaleWidth = canvas.width * scale;
    const scaleHeight = canvas.height * scale;

    const scaleOffsetX = (scaleWidth - canvas.width) / 2;
    const scaleOffsetY = (scaleHeight - canvas.height) / 2;
    setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY });

    // Save the state of the canvas
    context?.save();

    // Translate the canvas based on pan or zoom:
    context?.translate(
      panOffset.x * scale - scaleOffsetX,
      panOffset.y * scale - scaleOffsetY
    );

    // Zoom the canvas
    context?.scale(scale, scale);

    // Loop through the list of elements to draw all of them on the canvas with roughjs
    elements.forEach((element) => {
      drawElement(roughCanvas, context!, element, penSize);
    });

    // Restore the state of the canvas back to before save()
    context?.restore();
  }, [elements, penSize, panOffset, scale]);

  //---------------------------------

  // Handle keyboard events
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      switch (e.key) {
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
    return () => document.removeEventListener("keydown", onKeydown);
  }, [undo, redo]);

  //-------------------------------

  // Handle zoom function
  const onZoom = useCallback(
    (delta: number) => {
      // definde the zoom step
      const zoomStep = delta > 0 ? 0.1 : -0.1;

      // calculate the new scale factor
      const newScale = scale + zoomStep;

      // define the minimum and maximum scale factor
      const minScale = 0.1;
      const maxScale = 10;

      // Ensure the new scale factor stays within the defined range
      const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);

      // Update the scale
      setScale(clampedScale);
    },
    [scale]
  );

  // Handle pan scrolling
  useEffect(() => {
    const panOrZoomFunction = (event: WheelEvent) => {
      if (pressedKeys.has("Meta") || pressedKeys.has("Control")) {
        // Prevent default zoom behavior
        event.preventDefault();

        // Adjust the zoom factor as desired
        const zoomFactor = event.deltaY > 0 ? 0 - 1 : 0.1;

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
  }, [onZoom, pressedKeys]);

  ////////////////////////////////////////////////////////////

  // Functions

  const updateElement = (
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    elementType: ElementType
  ) => {
    const elementsCopy = [...elements];

    switch (elementType) {
      case "line":
      case "rectangle":
      case "circle":
        elementsCopy[id] = createElement({ id, x1, y1, x2, y2, elementType });
        break;
      case "pencil":
        elementsCopy[id].points = [
          ...elementsCopy[id].points!,
          { x: x2, y: y2 },
        ];
        break;
      case "erase":
        break;
      default:
        throw new Error(`Invalid tool: "${elementType}".`);
    }
    setElements(elementsCopy, true);
  };

  // ----------------------------

  // Event handler to update the pen size
  const handlePenSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPenSize(Number(event.target.value));
  };

  // -----------------------------

  //////////////////////////////////////////////////////////

  // ACTIONS

  // --------------------------------------------

  // MOUSE DOWN (start click the mouse on the canvas)
  const handleMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    // Check if mouse is clicked
    setIsMouseDown(true);

    // Current position of the mouse
    const { clientX, clientY } = getMouseCoordinates(
      event,
      panOffset,
      scale,
      scaleOffset
    );

    // Panning in the canvas
    if (event.button === 1 || pressedKeys.has(" ")) {
      setAction("panning");
      setStartPanMousePosition({ x: clientX, y: clientY });
    }

    // Erase element
    if (elementType === "erase") {
      const element = getElementAtPosition(clientX, clientY, elements);

      if (element) {
        const newElements = elements.filter((el) => el.id !== element!.id);

        setElements(newElements);
      }
    }

    // When use selection mode
    else if (elementType === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);

      if (element) {
        // If Drawing with freehand
        if (element.elementType === "pencil") {
          // Calculate the distance between each point of the line to the  position of the mouse cursor then sava it to array

          const xOffsets = element.points!.map(
            (point) => clientX - (point as StrokePoint).x
          );
          const yOffsets = element.points!.map(
            (point) => clientY - (point as StrokePoint).y
          );
          setSelectedElement({ ...element, xOffsets, yOffsets });
        }

        // If Drawing with rectangle, circle or line
        else {
          // Calculate the distance between the mouse to the coordinates of the element
          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;
          setSelectedElement({ ...element, offsetX, offsetY });
        }

        setElements((prevState: HistoryState) => prevState);

        // Check if user moving element or resizing element
        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      }
    }
    // Drawing mode
    else {
      // Set the id for the new created element
      const id = elements.length;

      // Create a new element based on the mouse position
      const element = createElement({
        id,
        x1: clientX,
        y1: clientY,
        x2: clientX,
        y2: clientY,
        elementType,
      });

      setAction("drawing");
      setElements((prevState: CanvasElement[][]) => [...prevState, element]);
      setSelectedElement(element);
    }
  };

  //==================================================================

  // MOUSE MOVE (Click mouse and move the mouse on the canvas)
  const handleMouseMove = throttle(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      // The position of the mouse cursor
      const { clientX, clientY } = getMouseCoordinates(
        event,
        panOffset,
        scale,
        scaleOffset
      );

      // Panning in the canvas with mouse + space
      if (action === "panning") {
        const deltaX = clientX - startPanMousePosition.x;
        const deltaY = clientY - startPanMousePosition.y;
        setPanOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        return;
      }

      // Erase element on the canvas
      if (elementType === "erase" && isMouseDown === true) {
        const element = getElementAtPosition(clientX, clientY, elements);

        if (element) {
          const newElements = elements.filter((el) => el.id !== element!.id);

          setElements(newElements);
        }
      }

      // Change the mouse cursor based on moving or drawing
      if (elementType === "selection") {
        const element = getElementAtPosition(clientX, clientY, elements);
        document.body.style.cursor = element
          ? cursorForPosition(element.position!)
          : "crosshair";
      }

      if (action === "drawing") {
        // Take out the current element
        const index = elements.length - 1;
        const { x1, y1, elementType } = elements[index];

        // Keep the position, only update the height and width due to the postion of the mouse
        updateElement(index, x1, y1, clientX, clientY, elementType);
      }
      // Moving element position
      if (action === "moving") {
        if (selectedElement!.elementType === "pencil") {
          const { id } = selectedElement as CanvasElement;
          const newPoints = selectedElement?.points!.map((point, index) => {
            return {
              x: clientX - selectedElement.xOffsets![index],
              y: clientY - selectedElement.yOffsets![index],
            };
          });

          const elementsCopy = [...elements];

          // Update the state of the drawing points
          elementsCopy[id] = {
            ...elementsCopy[id],
            points: newPoints,
          };

          setElements(elementsCopy, true);
        } else {
          // Update the state of the rectangle | line | circle when moving
          const { id, x1, y1, x2, y2, offsetX, offsetY, elementType } =
            selectedElement as CanvasElement;

          const width = x2 - x1;
          const height = y2 - y1;

          const newX1 = clientX - offsetX!;
          const newY1 = clientY - offsetY!;

          updateElement(
            id,
            newX1,
            newY1,
            newX1 + width,
            newY1 + height,
            elementType
          );
        }
      }

      // Resizing element
      if (action === "resizing") {
        // Resizing drawhand element
        if (selectedElement!.elementType === "pencil") {
          resizeDrawFreehand(
            elements,
            selectedElement!,
            clientX,
            clientY,
            setElements
          );
        }
        // Resizing other elements
        else {
          const { id, elementType, position, ...coordinates } =
            selectedElement as CanvasElement;

          const { x1, y1, x2, y2 } = resizeCoordinates(
            clientX,
            clientY,
            position!,
            coordinates
          )!;

          updateElement(id, x1, y1, x2, y2, elementType);
        }
      }
    },
    1000 / 60, // 60 FPS
    { leading: true, trailing: true }
  );

  //===================================================================

  // MOUSE UP (Stop clicking mouse/stop drawing)
  const handleMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setAction("none");
    setSelectedElement(null);
    setIsMouseDown(false);
  };

  // ====================================================================

  return (
    <div>
      <div className="fixed top-2 left-3 flex gap-3 z-10">
        <div>
          <input
            type="radio"
            id="selection"
            checked={elementType === "selection"}
            onChange={() => setElementType(ElementType.Selection)}
            className="mr-2"
          />
          <label htmlFor="selection">Selection</label>
        </div>

        <div>
          <input
            type="radio"
            id="line"
            checked={elementType === "line"}
            onChange={() => setElementType(ElementType.Line)}
            className="mr-2"
          />
          <label htmlFor="line">Line</label>
        </div>

        <div>
          <input
            type="radio"
            id="rectangle"
            checked={elementType === "rectangle"}
            onChange={() => setElementType(ElementType.Rectangle)}
            className="mr-2"
          />
          <label htmlFor="rectangle">Rectangle</label>
        </div>

        <div>
          <input
            type="radio"
            id="circle"
            checked={elementType === "circle"}
            onChange={() => setElementType(ElementType.Circle)}
            className="mr-2"
          />
          <label htmlFor="circle">Circle</label>
        </div>

        <div>
          <input
            type="radio"
            id="erase"
            checked={elementType === "erase"}
            onChange={() => setElementType(ElementType.Erase)}
            className="mr-2"
          />
          <label htmlFor="erase">Erase</label>
        </div>

        <div>
          <input
            type="radio"
            id="pencil"
            checked={elementType === "pencil"}
            onChange={() => setElementType(ElementType.Pencil)}
            className="mr-2"
          />
          <label htmlFor="pencil">Pencil</label>
        </div>

        {elementType === "pencil" && (
          <div>
            <input
              id="penSize"
              type="range"
              min={6}
              max={10}
              value={penSize}
              onChange={handlePenSizeChange}
            />
            <label htmlFor="penSize">Size</label>
          </div>
        )}
      </div>

      <div
        style={{ position: "fixed", bottom: 0, padding: 10, zIndex: 10 }}
        className="flex gap-4"
      >
        <button
          className="bg-slate-900 text-white p-3 rounded-md"
          onClick={() => {
            undo();
          }}
        >
          Undo
        </button>
        <button
          className="bg-slate-900 text-white p-3 rounded-md"
          onClick={() => {
            redo();
          }}
        >
          Redo
        </button>

        <div className="flex justify-center items-center fixed right-20">
          <button
            className="bg-slate-500 mr-3 px-3 py-1 text-white rounded-md"
            onClick={() => onZoom(-0.1)}
          >
            -
          </button>
          <button
            className="bg-slate-500 mr-3 px-3 py-1 text-white rounded-md"
            onClick={() => setScale(1)}
          >
            {`${new Intl.NumberFormat("en-GB", { style: "percent" }).format(
              scale
            )}`}
          </button>
          <button
            className="bg-slate-500 mr-3 px-3 py-1 text-white rounded-md"
            onClick={() => onZoom(0.1)}
          >
            +
          </button>
        </div>
      </div>

      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        className=""
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      ></canvas>
    </div>
  );
};

export default Home;
