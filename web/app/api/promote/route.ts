import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await req.json().catch(() => ({}));

  return NextResponse.json({
    id: "mock-dashboard-id",
    type: "json",
    data: {
      id: "chart-002",
      metadata: [
        {
          id: 14,
          name: "CATEGORY",
          display_name: "Category",
          base_type: "type/Text",
        },
        {
          id: null,
          name: "count",
          display_name: "Count of Orders",
          base_type: "type/Integer",
        },
      ],
      visual_config: {
        chart_type: "bar",
        title: "Orders by Category",
        x_axis: "Category",
        y_axis: "Count",
        format: "number",
      },
      cols: [
        {
          name: "CATEGORY",
          display_name: "Category",
          base_type: "type/Text",
        },
        {
          name: "count",
          display_name: "Count of Orders",
          base_type: "type/Integer",
        },
      ],
      rows: [
        ["Electronics", 245],
        ["Clothing", 189],
        ["Home & Garden", 156],
        ["Sports", 132],
        ["Books", 98],
      ],
    },
  });
}