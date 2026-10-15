import * as React from "react";
import { Button } from "@/shared/ui/kit/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Filter } from "lucide-react";
import { cn } from "@/shared/utils";
import { FilterFieldType } from "../../compat/types";
import { ColumnFilterValue } from "./ColumnFilterInput";
import { ColumnFilterInput } from "./ColumnFilterInput";
import { isColumnFilterValueFilled } from "./ColumnFilterInput";

type Props = {
 columnId: string;
 meta: FilterFieldType;
 value?: ColumnFilterValue;
 onChange: (value: ColumnFilterValue | undefined, immediate?: boolean) => void;
};

export const ColumnFilterAgTrigger: React.FC<Props> = ({
 columnId,
 meta,
 value,
 onChange,
}) => {
 const [open, setOpen] = React.useState(false);
 const isActive = isColumnFilterValueFilled(value?.value);

 const handleClear = () => {
 onChange(undefined, true);
 setOpen(false);
 };

 return (
 <DropdownMenu open={open} onOpenChange={setOpen}>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className={cn(
 "h-6 w-6",
 isActive
 ? "text-primary bg-primary/5"
 : "opacity-70 hover:opacity-100"
 )}
 aria-label="Configurer le filtre"
 >
 <Filter className="h-3 w-3" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent className="w-72 p-3" align="start">
 <ColumnFilterInput
 columnId={columnId}
 meta={meta}
 value={value}
 onChange={onChange}
 />
 <div className="mt-3 flex items-center justify-end gap-2">
 <Button variant="ghost" size="sm" onClick={handleClear}>
 Effacer
 </Button>
 <Button size="sm" onClick={() => setOpen(false)}>
 Fermer
 </Button>
 </div>
 </DropdownMenuContent>
 </DropdownMenu>
 );
};

