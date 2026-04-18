"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { KPIScorecard as KPIScorecardType } from "@/types/chart"

interface KPIScardsProps {
  scorecards: KPIScorecardType[];
}

function formatNumberMax2(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function parseAndFormatNumber(value: any): string {
  const numValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numValue) ? formatNumberMax2(numValue) : String(value);
}

function TrendIcon({ trend_status }: { trend_status: string }) {
  switch (trend_status) {
    case "positive":
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case "negative":
      return <TrendingDown className="h-4 w-4 text-red-500" />
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />
  }
}

export function KPIScorecards({ scorecards }: KPIScardsProps) {
  if (!scorecards || scorecards.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {scorecards.map((card, index) => (
        <Card key={index} className="border-border bg-card overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {parseAndFormatNumber(card.value)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TrendIcon trend_status={card.trend_status} />
                {card.trend_percentage !== "-" && (
                  <span className={`text-sm font-semibold ${
                    card.trend_status === "positive" ? "text-green-600" :
                    card.trend_status === "negative" ? "text-red-600" :
                    "text-muted-foreground"
                  }`}>
                    {`${parseAndFormatNumber(card.trend_percentage)}%`}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
