import { Moon, MoonIcon, Sun, SunIcon, Palette, Monitor } from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme";

export function ModeToggle() {
  const { theme, mode, setTheme, setMode, toggleMode } = useTheme();

  const themes = [
    { value: "default", label: "Default", icon: Monitor },
    { value: "nature", label: "nature", icon: Monitor },
    { value: "avatar", label: "Avatar", icon: Palette },
    { value: "dracula", label: "Dracula", icon: Palette },
    { value: "Amber", label: "Amber", icon: Palette },
    { value: "rose", label: "Rose", icon: Palette },
    { value: "modern", label: "modern", icon: Palette },
    { value: "brutalist", label: "brutalist", icon: Palette },
    { value: "pastel", label: "pastel", icon: Palette },
    { value: "corporate", label: "corporate", icon: Palette },
    { value: "cyberpunk", label: "cyberpunk", icon: Palette },
    { value: "organic", label: "organic", icon: Palette },
    { value: "accessible", label: "accessible", icon: Palette },
    { value: "vibrant", label: "vibrant", icon: Palette },
    { value: "mono", label: "mono", icon: Palette },
    { value: "warmth", label: "warmth", icon: Palette },
    { value: "solar", label: "solar", icon: Palette },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          {mode === "light" ? (
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all" />
          ) : (
            <Moon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all" />
          )}
          <span className="sr-only">Toggle theme and mode</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Theme & Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Mode Toggle */}
        <DropdownMenuItem onClick={toggleMode} className="cursor-pointer">
          {mode === "light" ? (
            <>
              <MoonIcon className="mr-2 h-4 w-4" />
              Switch to Dark
            </>
          ) : (
            <>
              <SunIcon className="mr-2 h-4 w-4" />
              Switch to Light
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Themes</DropdownMenuLabel>

        {/* Theme Selection */}
        {themes.map((themeOption: any) => {
          const IconComponent = themeOption.icon;
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`cursor-pointer ${
                theme === themeOption.value ? "bg-accent" : ""
              }`}
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {themeOption.label}
              {theme === themeOption.value && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
