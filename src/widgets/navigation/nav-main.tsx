import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { NavigationSection } from "@/shared/routing/navigation";
import { useTheme } from "@/shared/ui/theme";
import {
 Collapsible,
 CollapsibleContent,
 CollapsibleTrigger,
} from "@/shared/ui/kit/collapsible";
import {
 SidebarGroup,
 SidebarGroupContent,
 SidebarGroupLabel,
 SidebarMenu,
 SidebarMenuButton,
 SidebarMenuItem,
 SidebarMenuSub,
 SidebarMenuSubButton,
 SidebarMenuSubItem,
 useSidebar,
} from "@/shared/ui/kit/sidebar";
import { cn } from "@/shared/utils";

/**
 * Navigation tree used inside the sidebar.
 *
 * The component renders sections with collapsible items and highlights the
 * active branch based on the current pathname.
 */
export type NavMainProps = {
 navigationLinks: NavigationSection[];
};

export function NavMain({ navigationLinks }: NavMainProps) {
 const location = useLocation();
 const { state } = useSidebar();
 const isCollapsed = state === "collapsed";

 const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

 const matchesPath = (targetPath: string): boolean => {
 if (location.pathname === targetPath) {
 return true;
 }

 return location.pathname.startsWith(`${targetPath}/`);
 };

 useEffect(() => {
 setExpandedItems((prev) => {
 let next = prev;

 for (const section of navigationLinks) {
 for (const item of section.items) {
 if (!item.children?.length) {
 continue;
 }

 const hasActiveChild = item.children.some((child) =>
 matchesPath(child.path)
 );
 const isItemActive = matchesPath(item.path);

 if ((hasActiveChild || isItemActive) && !prev[item.id]) {
 next = { ...next, [item.id]: true };
 }
 }
 }

 return next;
 });
 }, [location.pathname, navigationLinks]);

 const { layout } = useTheme();

 const visibleSections =
 layout === "mixed"
 ? navigationLinks.filter((section) =>
 section.items.some(
 (item) =>
 location.pathname.startsWith(item.path) ||
 item.children?.some((child) =>
 location.pathname.startsWith(child.path)
 )
 )
 )
 : navigationLinks;

 return (
 <SidebarGroup className="py-0">
 <SidebarGroupContent className="flex flex-col gap-3">
 {visibleSections.map((section) => (
 <div key={section.id} className="space-y-1">
 {!isCollapsed && (
 <SidebarGroupLabel className="px-2 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
 {section.label}
 </SidebarGroupLabel>
 )}
 <SidebarMenu className="gap-0.5">
 {section.items
 .filter((item) => !item.hidden)
 .map((item, index) => {
 const visibleChildren = item.children?.filter(
 (child) => !child.hidden
 );
 const hasChildren = Boolean(visibleChildren?.length);
 const isItemActive =
 matchesPath(item.path) ||
 visibleChildren?.some((child) =>
 matchesPath(child.path)
 );
 const isOpen = hasChildren && Boolean(expandedItems[item.id]);

 if (!hasChildren) {
 return (
 <SidebarMenuItem 
 key={item.id} 
 style={{ animationDelay:`${index * 50}ms` }}
 className="animate-fade-in-slide opacity-0"
 >
 <SidebarMenuButton
 asChild
 tooltip={item.title}
 className={cn(
 "relative h-9 w-full transition-all duration-200 group/btn overflow-hidden ",
 isItemActive
 ? "bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/20"
 : "text-muted-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
 )}
 >
 <Link
 to={item.path}
 className="relative flex items-center gap-3 px-3 z-10"
 >
 {isItemActive && (
 <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-primary/10 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none opacity-50" />
 )}
 {item.icon && (
 <div className="relative flex items-center justify-center">
 {isItemActive && (
 <div className="absolute inset-0 -z-10 scale-[2.5] bg-primary/20 blur-xl animate-pulse" />
 )}
 <item.icon className={cn(
 "size-4 shrink-0 transition-transform duration-300 group-hover/btn:scale-110 relative z-10",
 isItemActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-muted-foreground/60 group-hover/btn:text-foreground"
 )} />
 </div>
 )}
 <span className="truncate">{item.title}</span>
 {isItemActive && !isCollapsed && (
 <div className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
 )}
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 );
 }

 return (
 <Collapsible
 key={item.id}
 asChild
 open={isOpen}
 onOpenChange={(open) =>
 setExpandedItems((prev) => ({
 ...prev,
 [item.id]: open,
 }))
 }
 className="group/collapsible"
 >
 <SidebarMenuItem 
 style={{ animationDelay:`${index * 50}ms` }}
 className="animate-fade-in-slide opacity-0"
 >
 <CollapsibleTrigger asChild>
 <SidebarMenuButton
 tooltip={item.title}
 className={cn(
 "h-9 transition-all duration-200 group/btn relative overflow-hidden",
 isItemActive && !isOpen
 ? "bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/20"
 : "text-muted-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
 )}
 >
 {isItemActive && !isOpen && (
 <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-primary/10 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none opacity-50" />
 )}
 {item.icon && (
 <div className="relative flex items-center justify-center">
 {isItemActive && (
 <div className="absolute inset-0 -z-10 scale-[2.5] bg-primary/20 blur-xl animate-pulse" />
 )}
 <item.icon className={cn(
 "size-4 shrink-0 transition-transform duration-300 group-hover/btn:scale-110 relative z-10",
 isItemActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-muted-foreground/60 group-hover/btn:text-foreground"
 )} />
 </div>
 )}
 <div className="flex flex-1 items-center justify-between overflow-hidden z-10">
 <span className="truncate">{item.title}</span>
 <ChevronRight className={cn(
 "ml-auto size-3.5 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90",
 isItemActive ? "text-primary" : "text-muted-foreground/40"
 )} />
 </div>
 {isItemActive && !isOpen && !isCollapsed && (
 <div className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
 )}
 </SidebarMenuButton>
 </CollapsibleTrigger>
 <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
 <SidebarMenuSub className="mt-1 ml-4 gap-1 border-l border-primary/10 pl-2">
 {visibleChildren?.map((child) => {
 const isChildActive =
 matchesPath(child.path);
 return (
 <SidebarMenuSubItem
 key={child.path}
 >
 <SidebarMenuSubButton
 asChild
 className={cn(
 "h-7 transition-all duration-200 ",
 isChildActive
 ? "bg-primary/5 text-primary font-semibold"
 : "text-muted-foreground/70 hover:bg-sidebar-accent/30 hover:text-foreground"
 )}
 >
 <Link
 to={child.path}
 className="flex w-full items-center gap-2 px-3"
 >
 <div className={cn(
 "size-1 transition-all duration-300",
 isChildActive ? "bg-primary scale-125 shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-muted-foreground/30"
 )} />
 <span className="truncate">{child.title}</span>
 </Link>
 </SidebarMenuSubButton>
 </SidebarMenuSubItem>
 );
 })}
 </SidebarMenuSub>
 </CollapsibleContent>
 </SidebarMenuItem>
 </Collapsible>
 );
 })}
 </SidebarMenu>
 </div>
 ))}
 </SidebarGroupContent>
 </SidebarGroup>
 );
}
