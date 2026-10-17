/** Supplier cockpit query; the host Apollo client supplies authentication and endpoint. */
import { gql } from "@apollo/client";
export const SUPPLIER_DETAIL_QUERY = gql`
  query SupplierDetailCockpit($id: ID!) {
    supplier(id: $id) {
      id
      name
      email
      phone
      address
      website
      notes
      nif
      art
      nis
      rc
      isActive
      isSupplier
      categorySpendingSummaries {
        categoryId
        categoryName
        annualLimit
        approvedSpending
        remainingAmount
        progressPercent
        limitExceeded
      }
      annualSpendingYear
      approvedFromBatch {
        id
        name
        status
      }
      lots {
        id
        code
        name
      }
      contacts {
        id
        name
        position
        phone
        email
        isPrimary
      }
    }
  }
`;
