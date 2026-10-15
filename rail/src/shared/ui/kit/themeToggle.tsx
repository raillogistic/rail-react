import { Moon, Sun, Palette } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/shared/ui/kit/dropdown-menu";
import { useTheme } from "@/shared/ui/theme";
import { cn } from "@/shared/utils";

export function ModeToggle() {
  const { theme, mode, setTheme, toggleMode, availableThemes } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-full bg-transparent border border-transparent shadow-none hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 group active:scale-95"
          aria-label="Apparence de l'interface"
        >
          {mode === "light" ? (
            <Sun className="h-[1.15rem] w-[1.15rem] group-hover:rotate-45 transition-transform duration-500" />
          ) : (
            <Moon className="h-[1.15rem] w-[1.15rem] group-hover:-rotate-12 transition-transform duration-500" />
          )}

          {/* Subtle glow effect behind icon on hover */}
          <span
            className={cn(
              "absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300",
              mode === "light" ? "bg-orange-500" : "bg-indigo-500",
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[280px] p-2 rounded-2xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
          Apparence visuelle
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1.5 bg-border/40" />

        <DropdownMenuGroup>
          <div className="p-1">
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault(); // Garde le menu ouvert après le switch (très confortable pour tester)
                toggleMode();
              }}
              className="w-full relative flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/80 focus:bg-muted/80 border border-transparent hover:border-border/60 focus:border-border/60 transition-all duration-300 group outline-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-[0.6rem] shadow-sm transition-colors",
                    mode === "light"
                      ? "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950 dark:to-amber-950"
                      : "bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950 dark:to-blue-950",
                  )}
                >
                  {mode === "light" ? (
                    <Sun className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-bold text-foreground leading-none group-hover:text-primary transition-colors">
                    Mode {mode === "light" ? "Clair" : "Sombre"}
                  </span>
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">
                    Basculer le style
                  </span>
                </div>
              </div>

              <div className="flex w-9 h-5 bg-background shadow-inner border border-input/50 rounded-full p-0.5 relative">
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-300 ease-out",
                    mode === "dark"
                      ? "translate-x-4 bg-indigo-500"
                      : "translate-x-0 bg-orange-500",
                  )}
                />
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1.5 bg-border/40" />

        <DropdownMenuLabel className="px-2 py-1.5 pt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
          <Palette className="w-3.5 h-3.5" />
          Thèmes de couleur
        </DropdownMenuLabel>

        <div
          className="max-h-[200px] overflow-y-auto overflow-x-hidden mt-1 pr-1.5"
          style={{ scrollbarWidth: "thin" }}
        >
          <DropdownMenuGroup className="grid grid-cols-2 gap-1.5 p-1">
            {availableThemes.map((themeOption) => {
              const isSelected = theme === themeOption.name;
              return (
                <DropdownMenuItem
                  key={themeOption.name}
                  onClick={(e) => {
                    e.preventDefault();
                    setTheme(themeOption.name);
                  }}
                  className={cn(
                    "cursor-pointer flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200 outline-none",
                    isSelected
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "hover:bg-muted/60 focus:bg-muted/60 text-foreground/70 hover:text-foreground active:scale-95",
                  )}
                >
                  <div
                    className={cn(
                      "w-3.5 h-3.5 rounded-full shadow-inner flex-shrink-0",
                      isSelected
                        ? "border border-primary/20"
                        : "border border-border/50",
                    )}
                    style={{
                      backgroundColor: isSelected
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground))",
                      opacity: isSelected ? 1 : 0.3,
                    }}
                  />
                  <span className="flex-1 truncate leading-none">
                    {themeOption.label}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
