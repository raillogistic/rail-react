import { useQuery, gql } from "@apollo/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/kit/card";

const GET_INVENTORY_STATS = gql`
  query GetInventoryStats {
    inventoryStats {
      campagnesOuvertes
      progressionMoyenne
      ecarts {
        label
        count
      }
      biensAbsents
      biensAReformer
    }
  }
`;

export function DashboardInventaire() {
  const { data, loading, error } = useQuery(GET_INVENTORY_STATS);

  if (loading) return <div>Chargement...</div>;
  if (error)
    return <div>Erreur de chargement des statistiques d'inventaire.</div>;

  const stats = data?.inventoryStats || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tableau de bord Inventaire</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Campagnes Ouvertes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{stats.campagnesOuvertes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progression Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-blue-600">
              {stats.progressionMoyenne}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Biens Absents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-red-600">
              {stats.biensAbsents}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Biens à Réformer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-orange-500">
              {stats.biensAReformer}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Écarts d'Inventaire Constatés</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {stats.ecarts?.map((item: any) => (
                <li
                  key={item.label}
                  className="flex justify-between py-2 border-b last:border-0"
                >
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
              {(!stats.ecarts || stats.ecarts.length === 0) && (
                <li className="py-2 text-muted-foreground">Aucun écart constaté.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
