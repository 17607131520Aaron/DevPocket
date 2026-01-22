import { createContext } from "react";

import type { ITabsContextType } from "./types";

export const TabsContext = createContext<ITabsContextType | undefined>(undefined);
