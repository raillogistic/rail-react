import { Button } from "@/shared/ui/kit/button";
import { Separator } from "@/shared/ui/kit/separator";
import { SidebarTrigger } from "@/shared/ui/kit/sidebar";
import { ModeToggle } from "@/shared/ui/kit/themeToggle";
import { 
  Bell, 
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/kit/breadcrumb";
import { useState, useEffect } from "react";
import { cn } from "@/shared/utils";
import { CommandMenu } from "@/widgets/navigation/command-menu";
import { UserNav } from "@/widgets/navigation/nav-user-menu";

/**
 * Props for the SiteHeader component.
 *
 * @property title - Current page title displayed prominently.
 * @property description - Optional subtext describing the active view.
 * @property sectionLabel - Optional badge showing the parent navigation section.
 */
export interface SiteHeaderProps {
  title: string;
  description?: string;
  sectionLabel?: string;
}

/**
 * Modern, beautiful and feature-rich top bar.
 * Anchors navigation controls, contextual page metadata, search, and user profile.
 */
export function SiteHeader({
  title,
  sectionLabel,
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300 ease-in-out",
        scrolled 
          ? "border-b bg-background/80 backdrop-blur-xl shadow-sm h-14" 
          : "border-b bg-background h-16"
      )}
    >
      <div className="flex h-full items-center gap-4 px-4 sm:px-6">
        {/* Left Section: Sidebar & Navigation */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <SidebarTrigger className="h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95" />
          <Separator orientation="vertical" className="h-6 mx-1 opacity-50" />
          
          <Breadcrumb className="hidden lg:flex animate-in fade-in slide-in-from-left-4 duration-500">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="hover:text-primary transition-colors font-medium">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              {sectionLabel && (
                <>
                  <BreadcrumbSeparator>
                    <ChevronRight className="size-3.5 opacity-40" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="hover:text-primary transition-colors font-medium">
                      {sectionLabel}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator>
                <ChevronRight className="size-3.5 opacity-40" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-bold text-foreground tracking-tight">
                  {title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="lg:hidden flex flex-col justify-center animate-in fade-in slide-in-from-left-4 duration-500">
             <h1 className="text-sm font-bold leading-none tracking-tight">{title}</h1>
             {sectionLabel && <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em] mt-0.5 opacity-70">{sectionLabel}</span>}
          </div>
        </div>

        {/* Center Section: Global Command Palette */}
        <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto px-4">
           <CommandMenu />
        </div>

        {/* Right Section: Actions & User Menu */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative hover:bg-accent group transition-all active:scale-95">
              <Bell className="h-[1.1rem] w-[1.1rem] group-hover:animate-ring transition-transform" />
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-primary border-2 border-background shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="sr-only">Notifications</span>
            </Button>
            
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-accent transition-all active:scale-95">
              <HelpCircle className="h-[1.1rem] w-[1.1rem]" />
              <span className="sr-only">Help</span>
            </Button>

            <Separator orientation="vertical" className="h-4 mx-2 opacity-50" />
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}

