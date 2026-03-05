import { createContext, useContext, ReactNode, useMemo } from "react";
import { ModelSchema } from "../types";
import { useTableMetadata } from "../hooks/useTableMetadata";
import {
 mergeModelSchemaWithRelationships,
 normalizeModelSchemaAccessors,
} from "../utils";

interface MetadataContextValue {
 metadata?: ModelSchema;
 loading: boolean;
 error?: Error;
 app: string;
 model: string;
 actionBootstrapLoading: boolean;
 actionBootstrapLoaded: boolean;
 actionDetailsLoading: boolean;
 actionDetailsLoaded: boolean;
 actionDetailsError?: Error;
 capabilitiesLoading: boolean;
 capabilitiesLoaded: boolean;
 capabilitiesError?: Error;
 ensureActionDetailsLoaded: () => Promise<void>;
 ensureCapabilitiesLoaded: () => Promise<void>;
 scheduleActionDetailsPrefetch: () => void;
 scheduleCapabilitiesPrefetch: () => void;
}

const MetadataContext = createContext<MetadataContextValue | undefined>(
 undefined,
);

interface MetadataProviderProps {
 app: string;
 model: string;
 children: ReactNode;
}

export function MetadataProvider({
 app,
 model,
 children,
}: MetadataProviderProps) {
 const {
 metadata,
 loading,
 error,
 actionBootstrapLoading,
 actionBootstrapLoaded,
 actionDetailsLoading,
 actionDetailsLoaded,
 actionDetailsError,
 capabilitiesLoading,
 capabilitiesLoaded,
 capabilitiesError,
 ensureActionDetailsLoaded,
 ensureCapabilitiesLoaded,
 scheduleActionDetailsPrefetch,
 scheduleCapabilitiesPrefetch,
 } = useTableMetadata(app, model);
 const mergedMetadata = useMemo(
 () =>
 normalizeModelSchemaAccessors(
 mergeModelSchemaWithRelationships(metadata),
 ),
 [metadata],
 );

 return (
 <MetadataContext.Provider
 value={{
 metadata: mergedMetadata,
 loading,
 error,
 app,
 model,
 actionBootstrapLoading,
 actionBootstrapLoaded,
 actionDetailsLoading,
 actionDetailsLoaded,
 actionDetailsError,
 capabilitiesLoading,
 capabilitiesLoaded,
 capabilitiesError,
 ensureActionDetailsLoaded,
 ensureCapabilitiesLoaded,
 scheduleActionDetailsPrefetch,
 scheduleCapabilitiesPrefetch,
 }}
 >
 {children}
 </MetadataContext.Provider>
 );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMetadata() {
 const context = useContext(MetadataContext);
 if (!context) {
 throw new Error("useMetadata must be used within a MetadataProvider");
 }
 return context;
}
