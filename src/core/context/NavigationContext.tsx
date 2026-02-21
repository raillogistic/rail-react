import { createContext, useContext } from "react";
import { NavigationSection, NavigationPage } from "../types/module";

interface NavigationContextType {
  sections: NavigationSection[];
  flattenedPages: NavigationPage[];
  defaultRoute: string;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
