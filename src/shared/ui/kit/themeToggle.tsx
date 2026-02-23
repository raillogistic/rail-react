import { Check, Moon, MoonIcon, Sun, SunIcon } from "lucide-react";

import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { useTheme } from "@/shared/ui/theme";

export function ModeToggle() {
  const { theme, mode, setTheme, toggleMode, availableThemes } = useTheme();

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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme & Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />

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

        {availableThemes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.name}
            onClick={() => setTheme(themeOption.name)}
            className={`cursor-pointer ${
              theme === themeOption.name ? "bg-accent" : ""
            }`}
          >
            {themeOption.label}
            {theme === themeOption.name && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
