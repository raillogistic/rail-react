/**
 * PresetManager - Gestion unifiée des filtres sauvegardés et des vues prédéfinies.
 * Offre une interface moderne pour organiser et réutiliser les configurations de filtrage.
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Clock,
  MoreHorizontal,
  Pencil,
  Share2,
  Star,
  Trash2,
  Users,
  Sparkles,
  Search,
  History,
  Info,
  Layers,
  LayoutGrid,
} from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/lib/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/lib/components/ui/alert-dialog";
import { Separator } from "@/lib/components/ui/separator";
import { cn } from "@/lib/utils";

import type { FilterPreset } from "../types";

export interface PresetManagerProps {
  /** Liste des presets disponibles */
  presets: FilterPreset[];
  /** IDs des presets actuellement sélectionnés/activés */
  selectedPresets: string[];
  /** Toggle l'activation d'un preset */
  onTogglePreset: (presetId: string) => void;
  /** Applique directement un preset (remplace les filtres actuels) */
  onApplyPreset: (preset: FilterPreset) => void;
  /** Callback pour éditer un preset */
  onEditPreset?: (preset: FilterPreset) => void;
  /** Callback pour supprimer un preset */
  onDeletePreset?: (preset: FilterPreset) => void;
  /** Callback pour partager un preset */
  onSharePreset?: (preset: FilterPreset) => void;
  /** Désactive les interactions */
  disabled?: boolean;
  /** Libellé du bouton/sélecteur */
  label?: string;
  /** Disposition: 'list' (popover) ou 'grid' (panneau) */
  layout?: "list" | "grid";
}

/**
 * PresetManager - Gère les vues sauvegardées avec une interface ERP moderne.
 */
export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  selectedPresets,
  onTogglePreset,
  onApplyPreset,
  onEditPreset,
  onDeletePreset,
  onSharePreset,
  disabled,
  label = "Vues enregistrées",
  layout = "list",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteDialogPreset, setDeleteDialogPreset] =
    useState<FilterPreset | null>(null);

  const groupedPresets = useMemo(() => {
    const groups = {
      static: [] as FilterPreset[],
      saved: [] as FilterPreset[],
      shared: [] as FilterPreset[],
    };

    presets.forEach((preset) => {
      groups[preset.source].push(preset);
    });

    groups.saved.sort((a, b) => {
      if (a.lastUsedAt && b.lastUsedAt) {
        return (
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
        );
      }
      return (b.useCount ?? 0) - (a.useCount ?? 0);
    });

    groups.shared.sort((a, b) => (b.useCount ?? 0) - (a.useCount ?? 0));

    return groups;
  }, [presets]);

  const filteredGroups = useMemo(() => {
    if (!search) return groupedPresets;

    const lower = search.toLowerCase();
    const filter = (p: FilterPreset) =>
      p.name.toLowerCase().includes(lower) ||
      p.description?.toLowerCase().includes(lower);

    return {
      static: groupedPresets.static.filter(filter),
      saved: groupedPresets.saved.filter(filter),
      shared: groupedPresets.shared.filter(filter),
    };
  }, [groupedPresets, search]);

  const totalCount = presets.length;
  const selectedCount = selectedPresets.length;
  const hasAnyPresets = totalCount > 0;

  const handleToggle = useCallback(
    (preset: FilterPreset) => {
      const presetId = preset.source === "static" ? preset.name : preset.id;
      onTogglePreset(presetId);
    },
    [onTogglePreset],
  );

  const handleApply = useCallback(
    (preset: FilterPreset) => {
      onApplyPreset(preset);
      setOpen(false);
    },
    [onApplyPreset],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deleteDialogPreset && onDeletePreset) {
      onDeletePreset(deleteDialogPreset);
      setDeleteDialogPreset(null);
    }
  }, [deleteDialogPreset, onDeletePreset]);

  if (!hasAnyPresets) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 border border-dashed rounded-xl bg-muted/5">
        <Bookmark className="h-10 w-10 mb-3 opacity-20" />
        <p className="text-sm font-medium">Aucune vue enregistrée</p>
      </div>
    );
  }

  // Grid Layout for use inside the FilterPanel Tabs
  if (layout === "grid") {
    return (
      <div className="space-y-6 pb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Rechercher des vues enregistrées..."
            className="w-full h-10 pl-10 pr-4 bg-muted/30 border-transparent rounded-xl text-sm focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all outline-none border hover:border-border/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {Object.entries(filteredGroups).map(([key, groupPresets]) => {
          if (groupPresets.length === 0) return null;

          const title =
            key === "static"
              ? "Vues système"
              : key === "saved"
                ? "Mes vues"
                : "Partagées avec moi";
          const icon =
            key === "static" ? (
              <Star className="h-4 w-4 text-yellow-500" />
            ) : key === "saved" ? (
              <Bookmark className="h-4 w-4 text-blue-500" />
            ) : (
              <Users className="h-4 w-4 text-green-500" />
            );

          return (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                {icon}
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  {title}
                </h4>
                <Separator className="flex-1 bg-muted/60" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groupPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    isSelected={selectedPresets.includes(
                      preset.source === "static" ? preset.name : preset.id,
                    )}
                    onToggle={() => handleToggle(preset)}
                    onApply={() => handleApply(preset)}
                    onEdit={
                      onEditPreset ? () => onEditPreset(preset) : undefined
                    }
                    onDelete={() => setDeleteDialogPreset(preset)}
                    onShare={
                      onSharePreset && !preset.isShared
                        ? () => onSharePreset(preset)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}

        {totalCount > 0 &&
          search &&
          Object.values(filteredGroups).every((g) => g.length === 0) && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                Aucune vue correspondante pour "{search}"
              </p>
            </div>
          )}

        <AlertDialog
          open={!!deleteDialogPreset}
          onOpenChange={(open) => !open && setDeleteDialogPreset(null)}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Supprimer la vue enregistrée ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer "
                <strong>{deleteDialogPreset?.name}</strong>" ? Cette action est
                irréversible et vous perdrez cette configuration.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              >
                Confirmer la suppression
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Popover / List Layout
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "justify-between gap-2 h-9 rounded-lg border-muted-foreground/20 bg-background hover:bg-muted/50 transition-all",
              selectedCount > 0 && "border-primary/50 ring-1 ring-primary/10",
            )}
            disabled={disabled}
          >
            <Bookmark
              className={cn(
                "h-4 w-4",
                selectedCount > 0
                  ? "text-primary fill-primary/10"
                  : "text-muted-foreground",
              )}
            />
            <span className="text-xs font-semibold">{label}</span>
            {selectedCount > 0 && (
              <Badge
                variant="default"
                className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-[10px]"
              >
                {selectedCount}
              </Badge>
            )}
            <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[320px] p-0 rounded-xl border-border/50 shadow-2xl overflow-hidden"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Rechercher des vues..."
              value={search}
              onValueChange={setSearch}
              className="h-10 text-xs"
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-8 text-center text-xs text-muted-foreground">
                Aucune vue trouvée
              </CommandEmpty>

              {filteredGroups.static.length > 0 && (
                <CommandGroup
                  heading={
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                      Par défaut système
                    </span>
                  }
                >
                  {filteredGroups.static.map((preset) => (
                    <PresetItem
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPresets.includes(preset.name)}
                      onToggle={() => handleToggle(preset)}
                    />
                  ))}
                </CommandGroup>
              )}

              {filteredGroups.saved.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup
                    heading={
                      <span className="text-[10px] font-bold uppercase tracking-tighter">
                        Mes favoris
                      </span>
                    }
                  >
                    {filteredGroups.saved.map((preset) => (
                      <PresetItem
                        key={preset.id}
                        preset={preset}
                        isSelected={selectedPresets.includes(preset.id)}
                        onToggle={() => handleToggle(preset)}
                        onEdit={
                          onEditPreset ? () => onEditPreset(preset) : undefined
                        }
                        onDelete={() => setDeleteDialogPreset(preset)}
                        onShare={
                          onSharePreset && !preset.isShared
                            ? () => onSharePreset(preset)
                            : undefined
                        }
                        showActions
                      />
                    ))}
                  </CommandGroup>
                </>
              )}

              {filteredGroups.shared.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup
                    heading={
                      <span className="text-[10px] font-bold uppercase tracking-tighter">
                        Vues partagées
                      </span>
                    }
                  >
                    {filteredGroups.shared.map((preset) => (
                      <PresetItem
                        key={preset.id}
                        preset={preset}
                        isSelected={selectedPresets.includes(preset.id)}
                        onToggle={() => handleToggle(preset)}
                      />
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            <div className="bg-muted/30 border-t p-2 px-3 text-[10px] text-muted-foreground font-medium flex items-center justify-between">
              <span>{totalCount} vues au total</span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Active
              </div>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <AlertDialog
        open={!!deleteDialogPreset}
        onOpenChange={(open) => !open && setDeleteDialogPreset(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la vue ?</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// --- Sub-components ---

// interface PresetCardProps {
//   preset: FilterPreset;
//   isSelected: boolean;
//   onToggle: () => void;
//   onApply: () => void;
//   onEdit?: () => void;
//   onDelete?: () => void;
//   onShare?: () => void;
// }

// const PresetCard: React.FC<PresetCardProps> = ({
//   preset,
//   isSelected,
//   onToggle,
//   onApply,
//   onEdit,
//   onDelete,
//   onShare,
// }) => {
//   return (
//     <Card
//       className={cn(
//         "group/card border bg-background/50 hover:bg-background hover:shadow-md hover:border-primary/30 transition-all duration-200 rounded-xl overflow-hidden cursor-pointer",
//         isSelected && "border-primary bg-primary/5 ring-1 ring-primary/10 shadow-sm"
//       )}
//       onClick={onToggle}
//     >
//       <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between space-y-0">
//         <div className="flex-1 min-w-0 pr-2">
//           <div className="flex items-center gap-2 mb-1">
//             <CardTitle className="text-sm font-bold truncate group-hover/card:text-primary transition-colors">
//               {preset.name}
//             </CardTitle>
//             {isSelected && <Badge className="h-4 px-1 text-[9px] bg-primary uppercase tracking-tighter">Actif</Badge>}
//           </div>
//           {preset.description ? (
//             <CardDescription className="text-[11px] line-clamp-1">{preset.description}</CardDescription>
//           ) : (
//             <span className="text-[10px] text-muted-foreground/40 italic">Aucune description fournie</span>
//           )}
//         </div>
//         <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
//           {onEdit && (
//             <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
//               <Pencil className="h-3.5 w-3.5" />
//             </Button>
//           )}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
//               <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
//                 <MoreHorizontal className="h-3.5 w-3.5" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-border/50 min-w-[140px]">
//               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onApply(); }} className="text-xs font-medium">
//                 <Sparkles className="mr-2 h-3.5 w-3.5" /> Appliquer
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggle(); }} className="text-xs font-medium">
//                 <Check className="mr-2 h-3.5 w-3.5" /> {isSelected ? "Désélectionner" : "Sélectionner"}
//               </DropdownMenuItem>
//               {onShare && (
//                 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }} className="text-xs font-medium">
//                   <Share2 className="mr-2 h-3.5 w-3.5" /> Partager
//                 </DropdownMenuItem>
//               )}
//               {onDelete && (
//                 <>
//                   <DropdownMenuSeparator />
//                   <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-xs font-medium text-destructive focus:text-destructive">
//                     <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
//                   </DropdownMenuItem>
//                 </>
//               )}
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </CardHeader>
//       <CardFooter className="p-3 pt-2 flex items-center justify-between border-t bg-muted/10">
//         <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
//           {preset.useCount != null && (
//             <span className="flex items-center gap-1">
//               <History className="h-3 w-3" /> {preset.useCount}
//             </span>
//           )}
//           {preset.lastUsedAt && (
//             <span className="flex items-center gap-1">
//               <Clock className="h-3 w-3" /> {new Date(preset.lastUsedAt).toLocaleDateString()}
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-1">
//           {preset.source === "static" && <Badge variant="outline" className="text-[9px] px-1 h-4 bg-yellow-500/10 text-yellow-600 border-yellow-200">SYSTÈME</Badge>}
//           {preset.isShared && <Badge variant="outline" className="text-[9px] px-1 h-4 bg-green-500/10 text-green-600 border-green-200">PARTAGÉ</Badge>}
//         </div>
//       </CardFooter>
//     </Card>
//   );
// };

// --- Sub-components ---

interface PresetCardProps {
  preset: FilterPreset;
  isSelected: boolean;
  onToggle: () => void;
  onApply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

// const PresetCard: React.FC<PresetCardProps> = ({
//   preset,
//   isSelected,
//   onToggle,
//   onApply,
//   onEdit,
//   onDelete,
//   onShare,
// }) => {
//   return (
//     <Card
//       className={cn(
//         "group/card border bg-background/50 hover:bg-background hover:shadow-md hover:border-primary/30 transition-all duration-200 rounded-xl overflow-hidden cursor-pointer",
//         isSelected &&
//           "border-primary bg-primary/5 ring-1 ring-primary/10 shadow-sm",
//       )}
//       onClick={onToggle}
//     >
//       xxxxx
//       <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between space-y-0">
//         <div className="flex-1 min-w-0 pr-2">
//           <div className="flex items-center gap-2 mb-1">
//             <CardTitle className="text-sm font-bold truncate group-hover/card:text-primary transition-colors">
//               {preset.name}
//             </CardTitle>
//             {isSelected && (
//               <Badge className="h-4 px-1 text-[9px] bg-primary uppercase tracking-tighter">
//                 Active
//               </Badge>
//             )}
//           </div>
//           {preset.description ? (
//             <CardDescription className="text-[11px] line-clamp-1">
//               {preset.description}
//             </CardDescription>
//           ) : (
//             <span className="text-[10px] text-muted-foreground/40 italic">
//               No description provided
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
//           {onEdit && (
//             <Button
//               variant="ghost"
//               size="icon"
//               className="h-7 w-7 rounded-md"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onEdit();
//               }}
//             >
//               <Pencil className="h-3.5 w-3.5" />
//             </Button>
//           )}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="h-7 w-7 rounded-md"
//               >
//                 <MoreHorizontal className="h-3.5 w-3.5" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent
//               align="end"
//               className="rounded-xl shadow-xl border-border/50 min-w-[140px]"
//             >
//               <DropdownMenuItem
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onApply();
//                 }}
//                 className="text-xs font-medium"
//               >
//                 <Sparkles className="mr-2 h-3.5 w-3.5" /> Apply
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onToggle();
//                 }}
//                 className="text-xs font-medium"
//               >
//                 <Check className="mr-2 h-3.5 w-3.5" />{" "}
//                 {isSelected ? "Deselect" : "Select"}
//               </DropdownMenuItem>
//               {onShare && (
//                 <DropdownMenuItem
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     onShare();
//                   }}
//                   className="text-xs font-medium"
//                 >
//                   <Share2 className="mr-2 h-3.5 w-3.5" /> Share
//                 </DropdownMenuItem>
//               )}
//               {onDelete && (
//                 <>
//                   <DropdownMenuSeparator />
//                   <DropdownMenuItem
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       onDelete();
//                     }}
//                     className="text-xs font-medium text-destructive focus:text-destructive"
//                   >
//                     <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
//                   </DropdownMenuItem>
//                 </>
//               )}
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </CardHeader>
//       <CardFooter className="p-3 pt-2 flex items-center justify-between border-t bg-muted/10">
//         <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
//           {preset.useCount != null && (
//             <span className="flex items-center gap-1">
//               <History className="h-3 w-3" /> {preset.useCount}
//             </span>
//           )}
//           {preset.lastUsedAt && (
//             <span className="flex items-center gap-1">
//               <Clock className="h-3 w-3" />{" "}
//               {new Date(preset.lastUsedAt).toLocaleDateString()}
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-1">
//           {preset.source === "static" && (
//             <Badge
//               variant="outline"
//               className="text-[9px] px-1 h-4 bg-yellow-500/10 text-yellow-600 border-yellow-200"
//             >
//               SYSTEM
//             </Badge>
//           )}
//           {preset.isShared && (
//             <Badge
//               variant="outline"
//               className="text-[9px] px-1 h-4 bg-green-500/10 text-green-600 border-green-200"
//             >
//               SHARED
//             </Badge>
//           )}
//         </div>
//       </CardFooter>
//     </Card>
//   );
// };

interface PresetItemProps {
  preset: FilterPreset;
  isSelected: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  showActions?: boolean;
}

const PresetItem: React.FC<PresetItemProps> = ({
  preset,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  onShare,
  showActions,
}) => {
  return (
    <CommandItem
      value={preset.name}
      onSelect={onToggle}
      className="flex items-center justify-between group py-2 px-3 focus:bg-primary/5 transition-all"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
            isSelected
              ? "bg-primary border-primary text-primary-foreground scale-110 shadow-sm"
              : "border-muted-foreground/30",
          )}
        >
          {isSelected && <Check className="h-2.5 w-2.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "text-xs font-semibold truncate block",
              isSelected && "text-primary",
            )}
          >
            {preset.name}
          </span>
          {preset.description && (
            <p className="text-[10px] text-muted-foreground truncate opacity-70">
              {preset.description}
            </p>
          )}
        </div>
      </div>
      {showActions && (onEdit || onDelete || onShare) && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      )}
    </CommandItem>
  );
};

export default PresetManager;
