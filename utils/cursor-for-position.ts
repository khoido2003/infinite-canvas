export const cursorForPosition = (position: string | null) => {
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
    case "border":
      return "ew-resize";
    default:
      return "default";
  }
};
