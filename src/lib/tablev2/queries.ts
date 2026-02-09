import {
  MODEL_METADATA_QUERY,
  TABLE_MODEL_METADATA_QUERY,
} from "@/lib/metadata/queries";

// Table metadata query (lean payload optimized for table rendering).
export const GET_MODEL_SCHEMA = TABLE_MODEL_METADATA_QUERY;

// Full metadata query (forms and advanced metadata consumers).
export const GET_MODEL_SCHEMA_FULL = MODEL_METADATA_QUERY;
