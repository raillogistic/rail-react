import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Badge } from "@/shared/ui/kit/badge";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Search, Loader2, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Package } from "lucide-react";
import type { FieldRenderContext } from "@/widgets/model-form/types/schema";
import type { PatrimoineAsset } from "@/models";
import { useModelListQuery } from "@/shared/api/graphql/graphql/hooks/useModelListQuery";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";
import { cn } from "@/shared/utils";

export function AssetSelectionField({ ctx }: { ctx: FieldRenderContext }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<PatrimoineAsset[]>([]);
  
  const [leftChecked, setLeftChecked] = useState<Set<string | number>>(new Set());
  const [rightChecked, setRightChecked] = useState<Set<string | number>>(new Set());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Current IDs in form state
  const selectedIds = Array.isArray(ctx.field.value) ? ctx.field.value : [];

  // Query to fetch the list of assets based on search
  const { data: searchData, loading: searchLoading } = useModelListQuery<PatrimoineAsset>({
    app: "patrimoine",
    model: "Asset",
    fields: ["id", "inventoryCode", "name", "administrativeStatus", "assetType"],
    variables: {
      where: {
        administrativeStatus: { 
          in: ["active", "assigned", "out_of_service", "reformed", "lost"] 
        },
        isActive: { eq: true },
        ...(debouncedSearch.trim() ? { quick: debouncedSearch } : {})
      },
    },
    apollo: {
      fetchPolicy: "cache-first"
    }
  });

  // Query to fetch initially selected assets details if not already loaded
  const missingIds = selectedIds.filter(id => !selectedAssets.some(a => String(a.id) === String(id)));
  const { data: initialSelectedData } = useModelListQuery<PatrimoineAsset>({
    app: "patrimoine",
    model: "Asset",
    fields: ["id", "inventoryCode", "name", "administrativeStatus", "assetType"],
    variables: {
      where: {
        id: { in: missingIds }
      },
    },
    apollo: {
      skip: missingIds.length === 0,
      fetchPolicy: "network-only"
    }
  });

  // Append newly fetched selected assets
  useEffect(() => {
    if (initialSelectedData?.length) {
      setSelectedAssets(prev => {
        const newAssets = [...prev];
        initialSelectedData.forEach(asset => {
          if (!newAssets.some(a => String(a.id) === String(asset.id))) {
            newAssets.push(asset);
          }
        });
        return newAssets;
      });
    }
  }, [initialSelectedData]);

  const availableAssets = useMemo(() => {
    return (searchData || []).filter(
      (a) => !selectedAssets.some((sa) => String(sa.id) === String(a.id))
    );
  }, [searchData, selectedAssets]);

  const toggleLeft = (id: string | number) => {
    const newSet = new Set(leftChecked);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setLeftChecked(newSet);
  };

  const toggleRight = (id: string | number) => {
    const newSet = new Set(rightChecked);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setRightChecked(newSet);
  };

  const moveRight = () => {
    const toMove = availableAssets.filter(a => leftChecked.has(a.id as string | number));
    const newSelected = [...selectedAssets, ...toMove];
    setSelectedAssets(newSelected);
    ctx.field.handleChange(newSelected.map(a => a.id));
    setLeftChecked(new Set());
  };

  const moveLeft = () => {
    const newSelected = selectedAssets.filter(a => !rightChecked.has(a.id as string | number));
    setSelectedAssets(newSelected);
    ctx.field.handleChange(newSelected.map(a => a.id));
    setRightChecked(new Set());
  };

  const moveAllRight = () => {
    const newSelected = [...selectedAssets, ...availableAssets];
    setSelectedAssets(newSelected);
    ctx.field.handleChange(newSelected.map(a => a.id));
    setLeftChecked(new Set());
  };

  const moveAllLeft = () => {
    setSelectedAssets([]);
    ctx.field.handleChange([]);
    setRightChecked(new Set());
    setLeftChecked(new Set());
  };

  const AssetRow = ({ 
    asset, 
    checked, 
    onToggle 
  }: { 
    asset: PatrimoineAsset, 
    checked: boolean, 
    onToggle: (id: string | number) => void 
  }) => (
    <div 
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer border",
        checked ? "bg-primary/10 border-primary/30" : "bg-card border-transparent hover:border-border"
      )}
      onClick={() => onToggle(asset.id as string | number)}
    >
      <Checkbox 
        checked={checked}
        onCheckedChange={() => onToggle(asset.id as string | number)}
        className="pointer-events-none"
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="font-semibold text-sm text-foreground truncate" title={asset.inventoryCode || ""}>
            {asset.inventoryCode}
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-background font-normal shrink-0">
            {asset.administrativeStatus || "Actif"}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground truncate" title={asset.name || ""}>
          {asset.name || "Sans nom"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch border rounded-lg p-4 bg-muted/20">
      
      {/* Left Column: Available Assets */}
      <div className="flex flex-col space-y-3 bg-background border rounded-lg p-3 shadow-sm h-[500px]">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Biens disponibles</h4>
          <Badge variant="secondary">{availableAssets.length}</Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher (100 max)..." 
            className="pl-8 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searchLoading && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <ScrollArea className="flex-1 border rounded-md bg-muted/10 p-2">
          {availableAssets.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground mt-10">
              {searchLoading ? "Recherche en cours..." : "Aucun bien disponible"}
            </div>
          ) : (
            <div className="space-y-1.5">
              {availableAssets.map(asset => (
                <AssetRow 
                  key={asset.id} 
                  asset={asset} 
                  checked={leftChecked.has(asset.id as string | number)} 
                  onToggle={toggleLeft} 
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Middle Column: Transfer Buttons */}
      <div className="flex flex-col items-center justify-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={moveRight} 
          disabled={leftChecked.size === 0}
          title="Ajouter la sélection"
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={moveLeft} 
          disabled={rightChecked.size === 0}
          title="Retirer la sélection"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="h-4" /> {/* Spacer */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={moveAllRight} 
          disabled={availableAssets.length === 0}
          title="Ajouter tout"
          type="button"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={moveAllLeft} 
          disabled={selectedAssets.length === 0}
          title="Retirer tout"
          type="button"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Right Column: Selected Assets */}
      <div className="flex flex-col space-y-3 bg-background border rounded-lg p-3 shadow-sm h-[500px]">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Biens à sortir</h4>
          <Badge variant="default">{selectedAssets.length}</Badge>
        </div>
        
        <div className="text-sm text-muted-foreground h-9 flex items-center px-1">
          {selectedAssets.length === 0 
            ? "Sélectionnez des biens pour la sortie" 
            : `${selectedAssets.length} bien(s) prêt(s) pour la sortie.`}
        </div>

        <ScrollArea className="flex-1 border rounded-md bg-muted/10 p-2">
          {selectedAssets.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground mt-10">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
              Aucun bien sélectionné
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedAssets.map(asset => (
                <AssetRow 
                  key={asset.id} 
                  asset={asset} 
                  checked={rightChecked.has(asset.id as string | number)} 
                  onToggle={toggleRight} 
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

    </div>
  );
}
