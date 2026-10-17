/** Keep link visibility scoped to the manifest instance mounted by this frontend. */
import { createContext, useContext } from "react";
import type { SharedAppContext } from "@raillogistic/shared-apps/runtime";

export const PartnerRoutesContext = createContext<SharedAppContext>({ isRouteEnabled: () => true });
export const usePartnerRoutes = () => useContext(PartnerRoutesContext);
