import {
  useTheme,
  themeNames,
  type ThemeName,
  type FontSize,
  type FontFamily,
  type LineHeight,
  type LetterSpacing,
} from "@/shared/ui/theme";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import { Label } from "@/shared/ui/kit/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/kit/toggle-group";
import { Button } from "@/shared/ui/kit/button";
import {
  IconSun,
  IconMoon,
  IconTextSize,
  IconLineHeight,
  IconSpacingHorizontal,
} from "@tabler/icons-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AppearanceSettings() {
  const {
    theme,
    setTheme,
    mode,
    setMode,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    letterSpacing,
    setLetterSpacing,
  } = useTheme();

  const handleNextTheme = () => {
    const currentIndex = themeNames.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    setTheme(themeNames[nextIndex] as ThemeName);
  };

  const handlePrevTheme = () => {
    const currentIndex = themeNames.indexOf(theme);
    const prevIndex = (currentIndex - 1 + themeNames.length) % themeNames.length;
    setTheme(themeNames[prevIndex] as ThemeName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>
            Personnalisez l'apparence de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Mode</Label>
            <div className="flex items-center space-x-4">
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={(value) => {
                  if (value) setMode(value as "light" | "dark");
                }}
              >
                <ToggleGroupItem value="light" aria-label="Light mode">
                  <IconSun className="h-4 w-4 mr-2" />
                  Clair
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark mode">
                  <IconMoon className="h-4 w-4 mr-2" />
                  Sombre
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Thème</Label>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handlePrevTheme}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value as ThemeName)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sélectionner un thème" />
                </SelectTrigger>
                <SelectContent>
                  {themeNames.map((themeName) => (
                    <SelectItem key={themeName} value={themeName}>
                      {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleNextTheme}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typographie</CardTitle>
          <CardDescription>
            Ajustez la taille et la famille de la police.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Taille de la police</Label>
            <ToggleGroup
              type="single"
              value={fontSize}
              onValueChange={(value) => {
                if (value) setFontSize(value as FontSize);
              }}
            >
              <ToggleGroupItem value="sm" aria-label="Small">
                <IconTextSize className="h-3 w-3 mr-2" />
                Petit
              </ToggleGroupItem>
              <ToggleGroupItem value="md" aria-label="Medium">
                <IconTextSize className="h-4 w-4 mr-2" />
                Moyen
              </ToggleGroupItem>
              <ToggleGroupItem value="lg" aria-label="Large">
                <IconTextSize className="h-5 w-5 mr-2" />
                Grand
              </ToggleGroupItem>
              <ToggleGroupItem value="xl" aria-label="Extra Large">
                <IconTextSize className="h-6 w-6 mr-2" />
                Très Grand
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label>Famille de police</Label>
            <Select
              value={fontFamily}
              onValueChange={(value) => setFontFamily(value as FontFamily)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sélectionner une police" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter (Défaut)</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="mono">Monospace</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="open-sans">Open Sans</SelectItem>
                <SelectItem value="lato">Lato</SelectItem>
                <SelectItem value="montserrat">Montserrat</SelectItem>
                <SelectItem value="source-code-pro">Source Code Pro</SelectItem>
                <SelectItem value="playfair-display">Playfair Display</SelectItem>
                <SelectItem value="fira-code">Fira Code</SelectItem>
                <SelectItem value="oxanium">Oxanium</SelectItem>
                <SelectItem value="geist">Geist</SelectItem>
                <SelectItem value="baloo-tamma-2">Baloo Tamma 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Interligne</Label>
            <ToggleGroup
              type="single"
              value={lineHeight}
              onValueChange={(value) => {
                if (value) setLineHeight(value as LineHeight);
              }}
            >
              <ToggleGroupItem value="compact" aria-label="Compact">
                <IconLineHeight className="h-3 w-3 mr-2" />
                Compact
              </ToggleGroupItem>
              <ToggleGroupItem value="normal" aria-label="Normal">
                <IconLineHeight className="h-4 w-4 mr-2" />
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem value="relaxed" aria-label="Relaxed">
                <IconLineHeight className="h-5 w-5 mr-2" />
                Relaxé
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label>Espacement</Label>
            <ToggleGroup
              type="single"
              value={letterSpacing}
              onValueChange={(value) => {
                if (value) setLetterSpacing(value as LetterSpacing);
              }}
            >
              <ToggleGroupItem value="tight" aria-label="Tight">
                <IconSpacingHorizontal className="h-3 w-3 mr-2" />
                Serré
              </ToggleGroupItem>
              <ToggleGroupItem value="normal" aria-label="Normal">
                <IconSpacingHorizontal className="h-4 w-4 mr-2" />
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem value="wide" aria-label="Wide">
                <IconSpacingHorizontal className="h-5 w-5 mr-2" />
                Large
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
