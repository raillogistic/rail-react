import * as React from "react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { ChevronDown, Search } from "lucide-react";
import { AdvancedFilteringController, FlattenedFilterField } from "./types";
import { cn } from "@/lib/utils";

type Props = {
  controller: AdvancedFilteringController;
  selectedFieldName?: string;
  onSelect: (fieldName: string) => void;
};

const getFieldLabel = (field?: FlattenedFilterField) =>
  field?.display_label ??
  field?.field.field_label ??
  field?.field.field_name ??
  "Sélectionner un champ";

export const FilterFieldSelector: React.FC<Props> = ({
  controller,
  selectedFieldName,
  onSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [expandedGroups, setExpandedGroups] = React.useState<
    Record<string, boolean>
  >({});
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setSearch("");
      setExpandedGroups({});
      const id = requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open]);

  const selectedField = controller.flattenedFields.find(
    (f) => f.field_name === selectedFieldName
  );

  const filteredGroups = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return controller.fieldGroups;
    return controller.fieldGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.display_label.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [controller.fieldGroups, search]);

  const handleSelect = (fieldName: string) => {
    onSelect(fieldName);
    setOpen(false);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          title={getFieldLabel(selectedField)}
        >
          <span className="truncate text-left">
            {getFieldLabel(selectedField)}
          </span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[360px] p-2" align="start">
        <div className="mb-2 flex items-center gap-2 rounded-md border px-2 py-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un champ..."
            className="border-none shadow-none focus-visible:ring-0 h-7 text-sm"
          />
        </div>
        <div className="max-h-72 overflow-auto pr-1 space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Aucun champ trouvé
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isOpen =
                group.key == "Champs simples" ||
                (expandedGroups[group.key] ?? false);
              return (
                <div key={group.key} className="rounded-md border px-2 py-1.5">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        isOpen ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-2 space-y-1">
                      {group.items.map((item) => (
                        <button
                          key={item.field_name}
                          type="button"
                          className={cn(
                            "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/70",
                            item.field_name === selectedFieldName &&
                              "bg-primary/10 text-primary"
                          )}
                          onClick={() => handleSelect(item.field_name)}
                        >
                          <span className="font-medium">
                            {item.path_labels.at(-1)}
                          </span>
                          {item.path_labels.length > 1 && (
                            <span className="text-[11px] text-muted-foreground">
                              {item.path_labels.slice(0, -1).join(" ▸ ")}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
