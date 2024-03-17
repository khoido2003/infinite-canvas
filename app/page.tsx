"use client";

import rough from "roughjs";
import { useCallback, useLayoutEffect, useState } from "react";
import { throttle } from "lodash";

import { CanvasElement, ElementType } from "@/types/type";
import { createElement } from "@/actions/create-element";

const Home = () => {
  // HOOKS

  // Check if drawing or not
  const [isDrawing, setIsDrawing] = useState(false);

  // List of elements on the canvas
  const [elements, setElements] = useState<CanvasElement[] | []>([]);

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

  // ACTIONS

  // --------------------------------------------

  // MOUSE DOWN (start click the mouse on the canvas)
  const handleMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setIsDrawing(true);
    const { clientX, clientY } = event;
    const element = createElement({
      x1: clientX,
      y1: clientY,
      x2: clientX,
      y2: clientY,
      elementType,
    });

    setElements((prev) => [...prev, element]);
  };

  //==================================================================

  // MOUSE MOVE (Click mouse and move the mouse on the canvas)
  const handleMouseMove = throttle(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      if (!isDrawing) return;

      // The new height and width of the element
      const { clientX, clientY } = event;

      // Take out the current element
      const index = elements.length - 1;
      const { x1, y1, elementType } = elements[index];

      // Keep the position, only update the height and width due to the postion of the mouse
      const updatedElement = createElement({
        x1,
        y1,
        x2: clientX,
        y2: clientY,
        elementType,
      });

      // Update the new height and width of the element
      const elementsCopy = [...elements];
      elementsCopy[index] = updatedElement;
      setElements(elementsCopy);
    },
    1000 / 60, // 60 FPS
    { leading: true, trailing: true }
  );

  //===================================================================

  // MOUSE UP (Stop clicking mouse/stop drawing)
  const handleMouseUp = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    setIsDrawing(false);
  };

  // ====================================================================

  return (
    <div>
      <div className="fixed top-2 left-3 flex gap-3">
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
