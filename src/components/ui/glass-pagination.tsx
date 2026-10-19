import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

function GlassPagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function GlassPaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex items-center gap-2", className)} {...props} />;
}

function GlassPaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li {...props} />;
}

const ghostCircle =
  "grid size-9 place-items-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-ruri hover:text-ruri dark:border-white/10 dark:hover:border-ruri-soft dark:hover:text-ruri-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer";

const activePill =
  "font-medium border-transparent bg-ruri text-white dark:bg-ruri-soft dark:text-deep";

interface GlassPaginationLinkProps extends React.ComponentProps<"a"> {
  isActive?: boolean;
  disabled?: boolean;
}

function GlassPaginationLink({ isActive, disabled, className, ...props }: GlassPaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled ? "true" : undefined}
      className={cn(
        ghostCircle,
        isActive && activePill,
        disabled && "opacity-30 pointer-events-none cursor-not-allowed hover:border-foreground/10 hover:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

interface GlassPaginationNavButtonProps extends React.ComponentProps<"a"> {
  disabled?: boolean;
}

function GlassPaginationPrevious({ disabled, className, ...props }: GlassPaginationNavButtonProps) {
  return (
    <a
      aria-label="Go to previous page"
      aria-disabled={disabled ? "true" : undefined}
      className={cn(
        ghostCircle,
        disabled && "opacity-30 pointer-events-none cursor-not-allowed hover:border-foreground/10 hover:text-muted-foreground",
        className
      )}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span className="sr-only">Previous</span>
    </a>
  );
}

function GlassPaginationNext({ disabled, className, ...props }: GlassPaginationNavButtonProps) {
  return (
    <a
      aria-label="Go to next page"
      aria-disabled={disabled ? "true" : undefined}
      className={cn(
        ghostCircle,
        disabled && "opacity-30 pointer-events-none cursor-not-allowed hover:border-foreground/10 hover:text-muted-foreground",
        className
      )}
      {...props}
    >
      <ChevronRight className="size-4" />
      <span className="sr-only">Next</span>
    </a>
  );
}

function GlassPaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cn("grid size-9 place-items-center text-faint", className)} {...props}>
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  GlassPagination,
  GlassPaginationContent,
  GlassPaginationItem,
  GlassPaginationLink,
  GlassPaginationPrevious,
  GlassPaginationNext,
  GlassPaginationEllipsis,
};
