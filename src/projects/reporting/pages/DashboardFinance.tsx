import { useQuery, gql } from "@apollo/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/kit/card";

const GET_FINANCE_STATS = gql`
  query GetFinanceStats {
    financeStats {
      valeurAcquisition
      valeurAmortissement
      valeurNetteComptable
      methodeAcquisition {
        label
        count
        totalValue
      }
      statutPropriete {
        label
        count
      }
      methodeSortie {
        label
        count
      }
      valeurNetteGlobale
      investissementVsExtra {
        label
        count
        totalValue
      }
    }
  }
`;

export function DashboardFinance() {
  const { data, loading, error } = useQuery(GET_FINANCE_STATS);

  if (loading) return <div>Chargement...</div>;
  if (error)
    return <div>Erreur de chargement des statistiques financières.</div>;

  const stats = data?.financeStats || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tableau de bord Finance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Valeur d'Acquisition (VAB)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">
              {stats.valeurAcquisition?.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Amortissements Cumulés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-red-500">
              {stats.valeurAmortissement?.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Valeur Nette Comptable (VNC)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-green-600">
              {stats.valeurNetteComptable?.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Méthode d'Acquisition</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.methodeAcquisition?.map((item: any) => (
                <li key={item.label} className="flex justify-between py-1 border-b last:border-0">
                  <span>
                    {item.label} ({item.count})
                  </span>
                  <span className="font-semibold">
                    {item.totalValue?.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Investissement vs Extra</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.investissementVsExtra?.map((item: any) => (
                <li key={item.label} className="flex justify-between py-1 border-b last:border-0">
                  <span>
                    {item.label} ({item.count})
                  </span>
                  <span className="font-semibold">
                    {item.totalValue?.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
