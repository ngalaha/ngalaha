import React, { createContext, useContext } from "react";
import { DEFAULT_FORMAT_ID, FormatPreset, getFormat, VideoFormatId } from "./formats";

const FormatContext = createContext<FormatPreset>(getFormat(DEFAULT_FORMAT_ID));

export const FormatProvider: React.FC<{
  format?: VideoFormatId;
  children: React.ReactNode;
}> = ({ format = DEFAULT_FORMAT_ID, children }) => {
  return (
    <FormatContext.Provider value={getFormat(format)}>
      {children}
    </FormatContext.Provider>
  );
};

/** Reads the active format preset (safe margins, min font sizes, dimensions). */
export const useFormat = (): FormatPreset => useContext(FormatContext);
