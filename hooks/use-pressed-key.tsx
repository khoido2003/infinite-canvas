import { useEffect, useState } from "react";

type PressedKeys = Set<string>;

export const usePressedKeys = (): PressedKeys => {
  const [pressedKeys, setPressedKeys] = useState<PressedKeys>(new Set());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKeys((prevKeys: PressedKeys) =>
        new Set(prevKeys).add(event.key)
      );
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys((prevKeys: PressedKeys) => {
        const updatedKeys = new Set(prevKeys);
        updatedKeys.delete(event.key);
        return updatedKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return pressedKeys;
};

export default usePressedKeys;
