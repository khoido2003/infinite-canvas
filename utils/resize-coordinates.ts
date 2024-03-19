export const resizeCoordinates = (
  clientX: number,
  clientY: number,
  position: string,
  coordinates: { x1: number; y1: number; x2: number; y2: number }
) => {
  const { x1, y1, x2, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "start":
    case "border":
      return { x1: clientX, y1: clientY, x2, y2 };

    case "tr":
      return { x1: clientX, y1, x2, y2: clientY };

    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };

    case "br":
    case "end":
      return { x1, x2: clientX, y1, y2: clientY };

    default:
      return null;
  }
};
