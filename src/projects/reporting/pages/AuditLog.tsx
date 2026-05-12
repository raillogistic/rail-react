import { useQuery, gql } from "@apollo/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/kit/card";

const GET_AUDIT_STATS = gql`
  query GetAuditStats {
    auditStats {
      parPeriode {
        label
        count
      }
      parProfil {
        label
        count
      }
      parAction {
        label
        count
      }
      parEntite {
        label
        count
      }
    }
  }
`;

export function AuditLog() {
  const { data, loading, error } = useQuery(GET_AUDIT_STATS);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur de chargement des statistiques d'audit.</div>;

  const stats = data?.auditStats || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Journal d'Audit</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Par Période (Mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.parPeriode?.map((item: any) => (
                <li key={item.label} className="flex justify-between py-1 border-b last:border-0">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Par Utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.parProfil?.map((item: any) => (
                <li key={item.label} className="flex justify-between py-1 border-b last:border-0">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Par Action</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.parAction?.map((item: any) => (
                <li key={item.label} className="flex justify-between py-1 border-b last:border-0">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Par Entité</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.parEntite?.map((item: any) => (
                <li key={item.label} className="flex justify-between py-1 border-b last:border-0">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
