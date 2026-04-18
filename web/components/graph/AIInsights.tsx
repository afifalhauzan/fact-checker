"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface AIInsightsProps {
  insights: string[];
}

export function AIInsights({ insights }: AIInsightsProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-base font-medium">AI Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li 
              key={index}
              className="flex gap-3 text-sm text-muted-foreground"
            >
              <span className="flex-shrink-0 text-primary font-semibold">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
