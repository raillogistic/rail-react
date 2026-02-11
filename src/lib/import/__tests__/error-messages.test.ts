import {
  humanizeImportUploadError,
  localizeImportIssue,
  summarizeImportIssues,
} from "../error-messages";

describe("import error messages", () => {
  it("translates known issue codes to french", () => {
    const localized = localizeImportIssue({
      id: "1",
      code: "INVALID_FIELD_VALUE",
      severity: "ERROR",
      message: "Invalid value for 'price'.",
      fieldPath: "price",
      rowNumber: 2,
      stage: "PARSE",
    });

    expect(localized.message.toLowerCase()).toContain("valeur invalide");
    expect(localized.message.toLowerCase()).toContain("price");
    expect(localized.message.toLowerCase()).toContain("ligne 2");
  });

  it("summarizes first translated issue for upload feedback", () => {
    const message = summarizeImportIssues([
      {
        id: "1",
        code: "MISSING_REQUIRED_COLUMN",
        severity: "ERROR",
        message: "Field is required.",
        fieldPath: "sku",
        rowNumber: 2,
        stage: "PARSE",
      },
    ]);

    expect(message.toLowerCase()).toContain("champ obligatoire");
  });

  it("humanizes incompatible GraphQL instance error", () => {
    const message = humanizeImportUploadError(
      new Error("Received incompatible instance '{...}'"),
    );
    expect(message.toLowerCase()).toContain("reponse d'import invalide");
  });

  it("extracts and localizes embedded issue payload from GraphQL incompatible instance", () => {
    const message = humanizeImportUploadError(
      new Error(
        "Received incompatible instance \"{'id': 'x', 'row_number': 2, 'field_path': 'sku', 'code': 'RECORD_NOT_FOUND', 'severity': 'ERROR', 'message': 'No existing record matches row update key.', 'suggested_fix': None, 'stage': 'VALIDATE'}\".",
      ),
    );
    expect(message.toLowerCase()).toContain("ligne 2");
    expect(message.toLowerCase()).toContain("sku");
    expect(message.toLowerCase()).toContain("aucun enregistrement existant");
  });

  it("keeps commit precondition detail for unknown errors", () => {
    const message = summarizeImportIssues([
      {
        id: "u1",
        code: "UNKNOWN_ERROR",
        severity: "ERROR",
        message: "Batch has changed since the last simulation.",
      },
    ]);
    expect(message.toLowerCase()).toContain("derniere simulation");
    expect(message.toLowerCase()).toContain("relancez la simulation");
  });

  it("translates foreign key assignment error to actionable french", () => {
    const message = summarizeImportIssues([
      {
        id: "u2",
        code: "UNKNOWN_ERROR",
        severity: "ERROR",
        message: 'Commit failed: Cannot assign "1": "Product.category" must be a "Category" instance.',
      },
    ]);
    expect(message.toLowerCase()).toContain("champ relation");
    expect(message.toLowerCase()).toContain("category");
    expect(message.toLowerCase()).toContain("identifiant numerique");
  });
});
