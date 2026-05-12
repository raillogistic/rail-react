import { useQuery, gql } from "@apollo/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/kit/card";

const GET_PATRIMOINE_STATS = gql`
  query GetPatrimoineStats {
    patrimoineStats {
      totalBiens
      biensSansLocalisation
      biensSansResponsable
      parCategorie {
        label
        count
      }
      parStatut {
        label
        count
      }
      parLocalisation {
        label
        count
      }
      parService {
        label
        count
      }
      parPropriete {
        label
        count
      }
    }
  }
`;

export function DashboardPatrimoine() {
  const { data, loading, error } = useQuery(GET_PATRIMOINE_STATS);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur de chargement des statistiques.</div>;

  const stats = data?.patrimoineStats || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tableau de bord Patrimoine</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total des biens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{stats.totalBiens}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Biens sans localisation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-orange-500">{stats.biensSansLocalisation}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Biens sans responsable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-orange-500">{stats.biensSansResponsable}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.parCategorie?.map((item: any) => (
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
            <CardTitle>Par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.parStatut?.map((item: any) => (
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
            <CardTitle>Par Propriété</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.parPropriete?.map((item: any) => (
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
