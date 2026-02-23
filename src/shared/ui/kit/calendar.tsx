import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/shared/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, classNames, showOutsideDays = true, ...props }, ref) => (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months:
          "flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex flex-col pt-1 items-center",
        caption_label: "text-xs font-medium mt-1",
        nav: "flex justify-between w-full px-1",
        nav_button:
          "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md",
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-xs",
        row: "flex w-full mt-2",
        cell:
          "relative h-7 w-7 text-center text-xs focus-within:relative focus-within:z-20",
        day: cn(
          "h-7 w-7 p-0 font-normal aria-selected:opacity-100 rounded-md",
          "hover:bg-accent hover:text-accent-foreground",
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: (props) => <ChevronLeft className="h-4 w-4" {...props} />,
        IconRight: (props) => <ChevronRight className="h-4 w-4" {...props} />,
      }}
      {...props}
      ref={ref}
    />
  ),
);
Calendar.displayName = "Calendar";

export { Calendar };
