"use client";

import { env } from "@sab-colour-profile/env/web";
import { Toaster } from "@sab-colour-profile/ui/components/sonner";
import { TooltipProvider } from "@sab-colour-profile/ui/components/tooltip";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import { ThemeProvider } from "./theme-provider";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<TooltipProvider>
				<ConvexProvider client={convex}>{children}</ConvexProvider>
			</TooltipProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
