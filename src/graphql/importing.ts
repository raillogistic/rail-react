import { gql } from "@apollo/client";

export const MODEL_IMPORT_TEMPLATE_QUERY = gql`
  query ModelImportTemplate($appLabel: String!, $modelName: String!) {
    modelImportTemplate(appLabel: $appLabel, modelName: $modelName) {
      templateId
      appLabel
      modelName
      version
      exactVersion
      matchingKeyFields
      requiredColumns {
        name
        required
        dataType
        formatHint
        allowedValues
      }
      optionalColumns {
        name
        required
        dataType
        formatHint
        allowedValues
      }
      acceptedFormats
      maxRows
      maxFileSizeBytes
      downloadUrl
    }
  }
`;

export const MODEL_IMPORT_BATCH_QUERY = gql`
  query ModelImportBatch($batchId: ID!, $rowsPage: Int = 1, $rowsPerPage: Int = 200) {
    modelImportBatch(batchId: $batchId) {
      id
      appLabel
      modelName
      templateId
      templateVersion
      status
      totalRows
      validRows
      invalidRows
      createRows
      updateRows
      committedRows
      createdAt
      updatedAt
      rows(page: $rowsPage, perPage: $rowsPerPage) {
        id
        rowNumber
        editedValues
        normalizedValues
        matchingKey
        action
        status
        issueCount
        updatedAt
      }
      issues(page: 1, perPage: 500) {
        id
        rowNumber
        fieldPath
        code
        severity
        message
        suggestedFix
        stage
      }
      lastValidation {
        totalRows
        validRows
        invalidRows
        blockingIssues
        warnings
      }
      lastSimulation {
        canCommit
        wouldCreate
        wouldUpdate
        blockingIssues
        warnings
        durationMs
      }
    }
  }
`;

export const MODEL_IMPORT_BATCH_PAGES_QUERY = gql`
  query ModelImportBatchPages(
    $page: Int = 1
    $perPage: Int = 50
    $appLabel: String
    $modelName: String
    $status: ImportBatchStatus
  ) {
    modelImportBatchPages(
      page: $page
      perPage: $perPage
      appLabel: $appLabel
      modelName: $modelName
      status: $status
    ) {
      page
      perPage
      total
      results {
        id
        appLabel
        modelName
        templateId
        templateVersion
        status
        totalRows
        validRows
        invalidRows
        createRows
        updateRows
        committedRows
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_MODEL_IMPORT_BATCH_MUTATION = gql`
  mutation CreateModelImportBatch($input: CreateModelImportBatchInput!) {
    createModelImportBatch(input: $input) {
      ok
      batch {
        id
        status
        appLabel
        modelName
        templateId
        templateVersion
      }
      issues {
        id
        code
        severity
        message
        rowNumber
        fieldPath
      }
    }
  }
`;

export const UPDATE_MODEL_IMPORT_BATCH_MUTATION = gql`
  mutation UpdateModelImportBatch($input: UpdateModelImportBatchInput!) {
    updateModelImportBatch(input: $input) {
      ok
      batch {
        id
        status
        totalRows
        validRows
        invalidRows
        createRows
        updateRows
        committedRows
      }
      rows {
        id
        rowNumber
        editedValues
        normalizedValues
        matchingKey
        action
        status
        issueCount
        updatedAt
      }
      issues {
        id
        code
        severity
        message
        rowNumber
        fieldPath
      }
      validationSummary {
        totalRows
        validRows
        invalidRows
        blockingIssues
        warnings
      }
      simulationSummary {
        canCommit
        wouldCreate
        wouldUpdate
        blockingIssues
        warnings
        durationMs
      }
      commitSummary {
        totalRows
        committedRows
        createRows
        updateRows
        skippedRows
      }
    }
  }
`;

export const DELETE_MODEL_IMPORT_BATCH_MUTATION = gql`
  mutation DeleteModelImportBatch($input: DeleteModelImportBatchInput!) {
    deleteModelImportBatch(input: $input) {
      ok
      deletedBatchId
    }
  }
`;

export const MODEL_IMPORT_ERROR_REPORT_QUERY = gql`
  query ModelImportErrorReport($batchId: ID!, $format: ImportErrorReportFormat = CSV) {
    modelImportErrorReport(batchId: $batchId, format: $format) {
      fileName
      contentType
      downloadUrl
      expiresAt
    }
  }
`;
