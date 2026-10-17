/** Partners reporting operations executed with the host Apollo client. */
import { gql } from "@apollo/client";
export const BUILD_REPORTING_REPORT_MUTATION = gql`
  mutation ReportingReportBuildPayload($code: String!, $filters: GenericScalar) {
    reportingReportBuildPayload(code: $code, filters: $filters) {
      status
      message
      data
    }
  }
`;

export const CREATE_REPORTING_EXPORT_JOB_MUTATION = gql`
  mutation ReportingExportJobCreate($reportCode: String!, $format: String!, $filters: GenericScalar) {
    reportingExportJobCreate(reportCode: $reportCode, format: $format, filters: $filters) {
      status
      message
      data
    }
  }
`;
