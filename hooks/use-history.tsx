import { SetElementProps } from "@/app/page";
import { useState } from "react";

export type HistoryState = [
  SetElementProps[],
  (action: any, overwrite?: boolean) => void,
  () => void,
  () => void
];

export const useHistory = (initState: SetElementProps[]): HistoryState => {
  const [index, setIndex] = useState(0);

  const [history, setHistory] = useState<SetElementProps[][]>([initState]);

  const setState = (action: any, overwrite = false) => {
    const newState =
      typeof action === "function" ? action(history[index]) : action;

    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      // update the history by removing old state and rewrite everything
      const updatedState = [...history].slice(0, index + 1);

      setHistory((prevState: SetElementProps[][]) => [
        ...updatedState,
        newState,
      ]);
      setIndex((prevState) => prevState + 1);
    }
  };

  const undo = () => {
    index > 0 && setIndex((prevState) => prevState - 1);
  };

  const redo = () => {
    index < history.length - 1 && setIndex((prevState) => prevState + 1);
  };

  return [history[index], setState, undo, redo];
};
