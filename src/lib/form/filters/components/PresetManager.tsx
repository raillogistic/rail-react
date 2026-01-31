/**
 * PresetManager - Unified preset and saved filter management.
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
} from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
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
import { cn } from "@/lib/utils";

import type { FilterPreset } from "../types";

export interface PresetManagerProps {
  presets: FilterPreset[];
  selectedPresets: string[];
  onTogglePreset: (presetId: string) => void;
  onApplyPreset: (preset: FilterPreset) => void;
  onEditPreset?: (preset: FilterPreset) => void;
  onDeletePreset?: (preset: FilterPreset) => void;
  onSharePreset?: (preset: FilterPreset) => void;
  disabled?: boolean;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  selectedPresets,
  onTogglePreset,
  onApplyPreset,
  onEditPreset,
  onDeletePreset,
  onSharePreset,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteDialogPreset, setDeleteDialogPreset] = useState<FilterPreset | null>(null);

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
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
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
    [onTogglePreset]
  );

  const handleApply = useCallback(
    (preset: FilterPreset) => {
      onApplyPreset(preset);
      setOpen(false);
    },
    [onApplyPreset]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deleteDialogPreset && onDeletePreset) {
      onDeletePreset(deleteDialogPreset);
      setDeleteDialogPreset(null);
    }
  }, [deleteDialogPreset, onDeletePreset]);

  if (!hasAnyPresets) {
    return null;
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between gap-2"
            disabled={disabled}
          >
            <Bookmark className="h-4 w-4" />
            <span>Saved Filters</span>
            {selectedCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {selectedCount}
              </Badge>
            )}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search presets..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">No presets found</p>
                </div>
              </CommandEmpty>

              {filteredGroups.static.length > 0 && (
                <CommandGroup heading={
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>Built-in</span>
                  </div>
                }>
                  {filteredGroups.static.map((preset) => (
                    <PresetItem
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPresets.includes(preset.name)}
                      onToggle={() => handleToggle(preset)}
                      onApply={() => handleApply(preset)}
                    />
                  ))}
                </CommandGroup>
              )}

              {filteredGroups.saved.length > 0 && (
                <>
                  {filteredGroups.static.length > 0 && <CommandSeparator />}
                  <CommandGroup heading={
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-3 w-3 text-blue-500" />
                      <span>My Filters</span>
                    </div>
                  }>
                    {filteredGroups.saved.map((preset) => (
                      <PresetItem
                        key={preset.id}
                        preset={preset}
                        isSelected={selectedPresets.includes(preset.id)}
                        onToggle={() => handleToggle(preset)}
                        onApply={() => handleApply(preset)}
                        onEdit={onEditPreset ? () => onEditPreset(preset) : undefined}
                        onDelete={() => setDeleteDialogPreset(preset)}
                        onShare={
                          onSharePreset && !preset.isShared
                            ? () => onSharePreset(preset)
                            : undefined
                        }
                        showActions
                        showLastUsed
                      />
                    ))}
                  </CommandGroup>
                </>
              )}

              {filteredGroups.shared.length > 0 && (
                <>
                  {(filteredGroups.static.length > 0 || filteredGroups.saved.length > 0) && (
                    <CommandSeparator />
                  )}
                  <CommandGroup heading={
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-green-500" />
                      <span>Shared Filters</span>
                    </div>
                  }>
                    {filteredGroups.shared.map((preset) => (
                      <PresetItem
                        key={preset.id}
                        preset={preset}
                        isSelected={selectedPresets.includes(preset.id)}
                        onToggle={() => handleToggle(preset)}
                        onApply={() => handleApply(preset)}
                        showAuthor
                        showLastUsed
                      />
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>

            <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>{totalCount} preset{totalCount !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" /> = active
              </span>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={!!deleteDialogPreset}
        onOpenChange={(open) => !open && setDeleteDialogPreset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved filter?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialogPreset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface PresetItemProps {
  preset: FilterPreset;
  isSelected: boolean;
  onToggle: () => void;
  onApply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  showActions?: boolean;
  showAuthor?: boolean;
  showLastUsed?: boolean;
}

const PresetItem: React.FC<PresetItemProps> = ({
  preset,
  isSelected,
  onToggle,
  onApply,
  onEdit,
  onDelete,
  onShare,
  showActions,
  showAuthor,
  showLastUsed,
}) => {
  const lastUsed = preset.lastUsedAt
    ? new Date(preset.lastUsedAt).toLocaleDateString()
    : null;

  return (
    <CommandItem
      value={preset.name}
      onSelect={onToggle}
      className="flex items-center justify-between group"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className={cn(
            "h-4 w-4 rounded border flex items-center justify-center shrink-0",
            isSelected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30"
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-medium">{preset.name}</span>
            {preset.source === "static" && (
              <Star className="h-3 w-3 text-yellow-500 shrink-0" />
            )}
            {preset.isShared && (
              <Users className="h-3 w-3 text-green-500 shrink-0" />
            )}
          </div>
          {preset.description && (
            <p className="text-xs text-muted-foreground truncate">
              {preset.description}
            </p>
          )}
          {showAuthor && preset.createdBy && (
            <p className="text-xs text-muted-foreground">
              by {preset.createdBy.username}
            </p>
          )}
          {(preset.useCount != null && preset.useCount > 0) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Used {preset.useCount} times
            </div>
          )}
          {showLastUsed && lastUsed && (
            <div className="text-[10px] text-muted-foreground">Last used {lastUsed}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply();
                }}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Apply preset</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {showActions && (onEdit || onDelete || onShare) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onApply}>
                <Sparkles className="mr-2 h-4 w-4" />
                Apply
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </CommandItem>
  );
};

export default PresetManager;
