"use client";
import { Button } from "@sab-colour-profile/ui/components/button";
import { Logo } from "@sab-colour-profile/ui/components/logo";
import { cn } from "@sab-colour-profile/ui/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useMedia } from "@/hooks/use-media";

const menuItems = [
  { name: "Start Assessment", href: "/start" },
  { name: "Responses", href: "#responses" },
];

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { scrollY } = useScroll();
  const isLarge = useMedia("(min-width: 64rem)");

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 75);
  });

  return (
    <header>
      <nav data-state={menuState && "active"} className="fixed z-20 w-full">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-6 lg:gap-0">
            <div
              className={cn(
                "flex justify-between gap-6 duration-200 max-lg:w-full",
                isScrolled && "lg:opacity-0 lg:blur-[4px]",
              )}
            >
              <div className="hidden size-fit lg:block">
                <NavItems />
              </div>
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2 lg:hidden"
              >
                <Logo />
              </Link>
            </div>

            {isLarge && <FloatingNavPill isScrolled={isScrolled} />}
          </div>
        </div>
      </nav>
    </header>
  );
};

const NavItems = () => {
  return (
    <ul className="flex gap-1 max-lg:flex-col">
      {menuItems.map((item, index) => (
        <li key={index}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full rounded-md max-lg:h-12 max-lg:justify-start max-lg:text-lg"
            // @ts-expect-error
            render={<Link href={item.href} className="text-base" />}
            nativeButton={false}
          >
            <span>{item.name}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
};

const FloatingNavPill = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <motion.div
      animate={{
        // gap: isScrolled ? "0.5rem" : "0rem",
        background: isScrolled ? "var(--color-card)" : "transparent",
      }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.1 }}
      className={cn(
        "absolute inset-0 z-50 m-auto flex size-fit h-11 items-center rounded-lg transition-colors duration-500",
        isScrolled &&
          "shadow-foreground/6.5 shadow-lg ring-1 ring-border backdrop-blur",
      )}
    >
      <Link
        href="/"
        aria-label="home"
        className="flex items-center gap-2 pr-2 pl-3.5"
      >
        <Image src="/logo.png" alt="logo" width={35} height={35} />
      </Link>
      <AnimatePresence initial={false}>
        {isScrolled && (
          <motion.div
            initial={{
              opacity: 0,
              x: -156,
              scale: 0.8,
              filter: "blur(4px)",
              width: 0,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              filter: "blur(0px)",
              width: "auto",
            }}
            exit={{
              opacity: 0,
              x: -156,
              scale: 0.8,
              filter: "blur(4px)",
              width: 0,
            }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.1 }}
            className="flex origin-left items-center overflow-hidden pr-3"
          >
            <NavItems />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
