"use client";

import rough from "roughjs";
import { useLayoutEffect, useState } from "react";
import { throttle } from "lodash";

import { CanvasElement, ElementType } from "@/types/type";
import { createElement } from "@/actions/create-element";
import { getElementAtPosition } from "@/utils/get-element-at-position";

const Home = () => {
  // HOOKS

  // Check if drawing or not
  const [action, setAction] = useState<"moving" | "drawing" | "none">("none");

  // List of elements on the canvas
  const [elements, setElements] = useState<CanvasElement[] | []>([]);

  // The element currently being drawn or selected
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(
    null
  );

  // Type of the element: rectangle, line, pencil, circle
  const [elementType, setElementType] = useState<ElementType>(
    () => ElementType.Rectangle
  );

  useLayoutEffect(() => {
    // Setup the canvas
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    // representing a two-dimensional rendering context.
    const context = canvas.getContext("2d");

    // Erase the whole canvas or else the old element or old state will still be there and causing some weird behaviors.
    context?.clearRect(0, 0, canvas.width, canvas.height);

    // Linking roughjs to html canvas
    const roughCanvas = rough.canvas(canvas);

    // Loop through the list of elements to draw all of them on the canvas with roughjs
    elements.forEach((element) => {
      roughCanvas.draw(element.roughElement!);
    });
  }, [elements]);

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
    const updatedElement = createElement({ id, x1, y1, x2, y2, elementType });

    const elementsCopy = [...elements];
    elementsCopy[id] = updatedElement;
    setElements(elementsCopy);
  };

  //////////////////////////////////////////////////////////

  // ACTIONS

  // --------------------------------------------

  // MOUSE DOWN (start click the mouse on the canvas)
  const handleMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const { clientX, clientY } = event;

    if (elementType === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);

      if (element) {
        // Calculate the distance between the mouse to the coordinates of the element
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;

        setSelectedElement({ ...element, offsetX, offsetY });
        setAction("moving");
      }
    } else {
      // Set the id for the new created element
      const id = elements.length;

      // Current position of the mouse
      const { clientX, clientY } = event;

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
      setElements((prev) => [...prev, element]);
    }
  };

  //==================================================================

  // MOUSE MOVE (Click mouse and move the mouse on the canvas)
  const handleMouseMove = throttle(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      // The position of the mouse cursor
      const { clientX, clientY } = event;

      // Change the mouse cursoe based on moving or drawing
      if (elementType === "selection") {
        document.body.style.cursor = getElementAtPosition(
          clientX,
          clientY,
          elements
        )
          ? "move"
          : "default";
      }

      if (action === "drawing") {
        // Take out the current element
        const index = elements.length - 1;
        const { x1, y1, elementType } = elements[index];

        // Keep the position, only update the height and width due to the postion of the mouse

        updateElement(index, x1, y1, clientX, clientY, elementType);
        // const updatedElement = createElement({
        //   id: 1,
        //   x1,
        //   y1,
        //   x2: clientX,
        //   y2: clientY,
        //   elementType,
        // });

        // // Update the new height and width of the element
        // const elementsCopy = [...elements];
        // elementsCopy[index] = updatedElement;
        // setElements(elementsCopy);
      } else if (action === "moving") {
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
  };

  // ====================================================================

  return (
    <div>
      <div className="fixed top-2 left-3 flex gap-3">
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
