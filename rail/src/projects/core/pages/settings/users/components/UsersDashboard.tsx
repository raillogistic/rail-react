import { gql, useQuery } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";

const USERS_DASHBOARD_QUERY = gql`
  query UsersDashboardStats {
    dashboardStats {
      users {
        totalUsers
        staffUsers
        totalProfiles
      }
    }
  }
`;

const numberFormatter = new Intl.NumberFormat("fr-FR");

export function UsersDashboard() {
  const { data, loading } = useQuery(USERS_DASHBOARD_QUERY);
  const stats = data?.dashboardStats?.users;

  const cards = [
    {
      label: "Utilisateurs",
      description: "Comptes actifs",
      value: stats?.totalUsers,
    },
    {
      label: "Staff",
      description: "Acces administration",
      value: stats?.staffUsers,
    },
    {
      label: "Profils",
      description: "Profils metiers",
      value: stats?.totalProfiles,
    },
  ];

  if (loading && !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <CardTitle className="h-6 w-28 rounded bg-muted" />
              <CardDescription className="h-4 w-40 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-10 w-24 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle>{card.label}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {card.value != null ? numberFormatter.format(card.value) : "-"}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
