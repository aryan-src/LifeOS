"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  LayoutDashboard,
  Kanban,
  CheckSquare,
  CheckCircle2,
  Wallet,
  FileText,
  Settings,
  LayoutGrid,
} from "lucide-react";

export interface DockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export const DEFAULT_DOCK_ITEMS: DockItem[] = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="h-full w-full" />,
    href: "/",
  },
  {
    title: "Projects",
    icon: <Kanban className="h-full w-full" />,
    href: "/projects",
  },
  {
    title: "Daily Tasks",
    icon: <CheckSquare className="h-full w-full" />,
    href: "/tasks",
  },
  {
    title: "Habits",
    icon: <CheckCircle2 className="h-full w-full" />,
    href: "/habits",
  },
  {
    title: "Finances",
    icon: <Wallet className="h-full w-full" />,
    href: "/finances",
  },
  {
    title: "Notes",
    icon: <FileText className="h-full w-full" />,
    href: "/notes",
  },
  {
    title: "Settings",
    icon: <Settings className="h-full w-full" />,
    href: "/settings",
  },
];

export const FloatingDock = ({
  items = DEFAULT_DOCK_ITEMS,
  desktopClassName,
  mobileClassName,
}: {
  items?: DockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop className={desktopClassName} items={items} />
      <FloatingDockMobile className={mobileClassName} items={items} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-3 flex flex-col gap-2 items-center"
          >
            {items.map((item, idx) => {
              const isActive =
                item.href === "/" || item.href === "/dashboard"
                  ? pathname === "/" || pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              const targetHref = item.href === "/" ? "/dashboard" : item.href;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    transition: { delay: idx * 0.05 },
                  }}
                  transition={{ delay: (items.length - 1 - idx) * 0.05 }}
                >
                  <Link
                    href={targetHref}
                    key={item.title}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md border shadow-sm transition-colors",
                      isActive
                        ? "bg-white text-stone-900 border-stone-300 dark:bg-zinc-800 dark:text-stone-100 dark:border-zinc-700 shadow-xs"
                        : "bg-white/90 text-stone-600 border-stone-200/70 hover:bg-stone-100 dark:bg-zinc-900/90 dark:text-stone-300 dark:border-zinc-800 dark:hover:bg-zinc-800"
                    )}
                    aria-label={item.title}
                    title={item.title}
                  >
                    <div className="h-4 w-4 flex items-center justify-center">
                      {item.icon}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md bg-white/90 dark:bg-zinc-950/90 border border-stone-200/60 dark:border-zinc-800/60 shadow-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
        aria-label="Toggle navigation dock"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) => {
  const mouseY = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseY.set(e.pageY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      className={cn(
        "w-16 flex-col items-center py-4 px-3 gap-3 rounded-2xl backdrop-blur-md bg-white/60 dark:bg-zinc-950/70 border border-stone-200/50 dark:border-zinc-800/50 shadow-lg shadow-stone-900/5 dark:shadow-black/30 hidden md:flex",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer key={item.title} mouseY={mouseY} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseY,
  title,
  icon,
  href,
}: {
  mouseY: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const distance = useTransform(mouseY, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  const isActive =
    href === "/" || href === "/dashboard"
      ? pathname === "/" || pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  const targetHref = href === "/" ? "/dashboard" : href;

  return (
    <Link
      href={targetHref}
      prefetch={true}
      className="relative block"
      title={title}
      aria-label={title}
    >
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full transition-colors cursor-pointer select-none",
          isActive
            ? "bg-white text-stone-900 shadow-sm dark:bg-zinc-800 dark:text-stone-100 ring-1 ring-stone-900/5 dark:ring-white/10"
            : "bg-stone-100/70 hover:bg-stone-200/60 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/60 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 border border-stone-200/30 dark:border-zinc-800/40"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: -6, y: "-50%" }}
              animate={{ opacity: 1, x: 0, y: "-50%" }}
              exit={{ opacity: 0, x: -6, y: "-50%" }}
              className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-fit rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs font-medium whitespace-pre text-stone-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-100 pointer-events-none z-50"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
