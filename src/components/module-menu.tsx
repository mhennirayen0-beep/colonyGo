"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ModuleMenuTrigger() {
  return (

      <Link href="/dashboard">
        <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white">
          <Image
            // Hotfix: logo = ant only (no "ColonyGo" text)
            src="/brand/colonygo-logo.png"
            alt="ColonyGo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <span className="sr-only">ColonyGo</span>
      </Link>

  );
}
