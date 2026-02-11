import type { ImportIssue } from "./types";

const formatIssuePrefix = (issue: Pick<ImportIssue, "rowNumber" | "fieldPath">): string => {
  const parts: string[] = [];
  if (issue.rowNumber != null) {
    parts.push(`ligne ${issue.rowNumber}`);
  }
  if (issue.fieldPath) {
    parts.push(`champ ${issue.fieldPath}`);
  }
  if (!parts.length) {
    return "";
  }
  return `${parts.join(", ")}: `;
};

const frenchMessageForIssueCode = (issue: ImportIssue): string | null => {
  const prefix = formatIssuePrefix(issue);
  const rawMessage = String(issue.message ?? "").trim();
  switch (issue.code) {
    case "INVALID_FIELD_VALUE":
      return `${prefix}valeur invalide.`;
    case "MISSING_REQUIRED_COLUMN":
      return `${prefix}champ obligatoire manquant.`;
    case "FILE_TOO_LARGE":
      return "Le fichier depasse la taille maximale autorisee.";
    case "ROW_LIMIT_EXCEEDED":
      return "Le fichier depasse le nombre maximal de lignes autorise.";
    case "INVALID_FILE_FORMAT":
      return "Format de fichier invalide. Utilisez un fichier CSV ou XLSX valide.";
    case "TEMPLATE_VERSION_MISMATCH":
      return "Le modele d'import ne correspond pas a la version attendue.";
    case "DUPLICATE_MATCHING_KEY":
      return `${prefix}cle de correspondance dupliquee.`;
    case "RECORD_NOT_FOUND":
      return `${prefix}aucun enregistrement existant ne correspond a la cle de mise a jour.`;
    case "PERMISSION_DENIED":
      return "Vous n'avez pas les droits suffisants pour executer cet import.";
    case "UNKNOWN_ERROR":
      if (!rawMessage) {
        return "Une erreur inattendue est survenue pendant l'import.";
      }
      const fkAssignMatch = /Cannot assign ["']?(.+?)["']?: ["']?([^"']+)\.([^"']+)["']? must be a ["']?([^"']+)["']? instance\./.exec(
        rawMessage,
      );
      if (fkAssignMatch) {
        const invalidValue = fkAssignMatch[1];
        const relationField = fkAssignMatch[3];
        return `${prefix}la valeur "${invalidValue}" pour le champ relation "${relationField}" est invalide. Utilisez l'identifiant numerique d'un enregistrement existant (ex: ${relationField}=1).`;
      }
      if (rawMessage.includes("Batch must be simulated successfully before commit")) {
        return "Le lot doit d'abord etre simule avec succes avant la finalisation.";
      }
      if (rawMessage.includes("Batch has changed since the last simulation")) {
        return "Le lot a ete modifie depuis la derniere simulation. Relancez la simulation avant de confirmer l'importation.";
      }
      const notNullMatch = /null value in column \"([^\"]+)\".*violates not-null constraint/i.exec(
        rawMessage,
      );
      if (notNullMatch?.[1]) {
        return `${prefix}le champ obligatoire \"${notNullMatch[1]}\" est vide. Renseignez une valeur valide puis relancez la validation.`;
      }
      return `${prefix}${rawMessage}`;
    default:
      return null;
  }
};

export const localizeImportIssue = (issue: ImportIssue): ImportIssue => {
  const translated = frenchMessageForIssueCode(issue);
  return {
    ...issue,
    message: translated ?? issue.message,
  };
};

export const localizeImportIssues = (issues: ImportIssue[] | null | undefined): ImportIssue[] =>
  (issues ?? []).map(localizeImportIssue);

export const summarizeImportIssues = (
  issues: ImportIssue[] | null | undefined,
  fallback = "Le televersement a echoue.",
): string => {
  const normalized = localizeImportIssues(issues);
  if (!normalized.length) {
    return fallback;
  }
  const first = normalized[0];
  return first?.message?.trim() || fallback;
};

const extractGraphQLErrorMessages = (error: unknown): string[] => {
  if (!error || typeof error !== "object") {
    return [];
  }
  const maybeGraphql = error as { graphQLErrors?: Array<{ message?: string }> };
  return (maybeGraphql.graphQLErrors ?? [])
    .map((entry) => (typeof entry?.message === "string" ? entry.message : ""))
    .filter(Boolean);
};

const extractQuotedField = (source: string, fieldName: string): string | null => {
  const singleQuoted = new RegExp(`'${fieldName}':\\s*'([^']*)'`);
  const singleMatch = singleQuoted.exec(source);
  if (singleMatch?.[1] != null) {
    return singleMatch[1];
  }
  const doubleQuoted = new RegExp(`"${fieldName}":\\s*"([^"]*)"`);
  const doubleMatch = doubleQuoted.exec(source);
  return doubleMatch?.[1] ?? null;
};

const extractOptionalStringField = (source: string, fieldName: string): string | null => {
  const value = extractQuotedField(source, fieldName);
  if (value != null) {
    return value;
  }
  const nonePattern = new RegExp(`'${fieldName}':\\s*None`);
  return nonePattern.test(source) ? null : null;
};

const extractEmbeddedIssueFromMessage = (raw: string): ImportIssue | null => {
  if (!raw.includes("Received incompatible instance")) {
    return null;
  }
  const code = extractQuotedField(raw, "code");
  if (!code) {
    return null;
  }
  const severity = extractQuotedField(raw, "severity");
  const stage = extractQuotedField(raw, "stage");
  const message = extractQuotedField(raw, "message");
  const fieldPath = extractOptionalStringField(raw, "field_path");
  const rowMatch = /'row_number':\s*(\d+)/.exec(raw);
  const rowNumber = rowMatch?.[1] != null ? Number(rowMatch[1]) : null;

  return {
    id: "graphql-embedded-issue",
    rowNumber,
    fieldPath,
    code,
    severity: severity === "WARNING" ? "WARNING" : "ERROR",
    message: message ?? raw,
    suggestedFix: null,
    stage: stage ?? "VALIDATE",
  };
};

export const humanizeImportError = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    const raw = error.message;
    if (raw.includes("Received incompatible instance")) {
      const embeddedIssue = extractEmbeddedIssueFromMessage(raw);
      if (embeddedIssue) {
        return summarizeImportIssues([embeddedIssue]);
      }
      return "Le serveur a renvoye une reponse d'import invalide. Reessayez dans quelques instants.";
    }
    if (raw.includes("Cannot return null for non-nullable field")) {
      return "Le serveur a renvoye des donnees d'import incompletes.";
    }
    if (raw.includes("Must provide query string")) {
      return "La requete d'import est invalide. Reessayez le televersement.";
    }
  }

  const graphQlMessages = extractGraphQLErrorMessages(error);
  if (graphQlMessages.length) {
    const synthetic = graphQlMessages.map((message) => {
      const embeddedIssue = extractEmbeddedIssueFromMessage(message);
      if (embeddedIssue) {
        return embeddedIssue;
      }
      return {
        id: "graphql",
        code: "UNKNOWN_ERROR",
        severity: "ERROR" as const,
        message,
      };
    }) as ImportIssue[];
    return summarizeImportIssues(synthetic);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Le televersement a echoue. Verifiez le fichier puis reessayez.";
};

export const humanizeImportUploadError = (error: unknown): string =>
  humanizeImportError(error);
