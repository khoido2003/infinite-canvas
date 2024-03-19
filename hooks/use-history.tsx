import { CanvasElement } from "@/types/type";
import { useState } from "react";

export type HistoryState = {
  elements: CanvasElement[];
  setState: (action: any, overwrite?: boolean) => void;
  undo: () => void;
  redo: () => void;
};

export const useHistory = (initState: CanvasElement[]) => {
  const [index, setIndex] = useState(0);

  // History array contain all the states
  const [history, setHistory] = useState<CanvasElement[][]>([initState]);

  const setState = (action: any, overwrite = false) => {
    const newState =
      typeof action === "function" ? action(history[index]) : action;

    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      // Update the state to match the index
      const updatedState = [...history].slice(0, index + 1);

      // Update the history to current state
      setHistory((prevState) => [...updatedState, newState]);

      // Update the index of the current state
      setIndex((prev) => prev + 1);
    }
  };

  const undo = () => {
    index > 0 && setIndex((prev) => prev - 1);
  };

  const redo = () => {
    index < history.length - 1 && setIndex((prev) => prev + 1);
  };

  return { elements: history[index], setState, undo, redo };
};
