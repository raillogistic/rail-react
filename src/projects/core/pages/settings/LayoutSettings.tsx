import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";

export function LayoutSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Navigation unifiée</CardTitle>
        <CardDescription>
          La disposition de l'application est désormais standardisée avec une
          barre d'applications à gauche et une sous-navigation contextuelle.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Les anciens modes verticale, horizontale et mixte ne sont plus
        configurables depuis l'interface.
      </CardContent>
    </Card>
  );
}
