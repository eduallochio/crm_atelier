// Tremor DonutChart [v1.0.0] — copy-paste component with local utils
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from "react"
import { Pie, PieChart as ReChartsDonutChart, ResponsiveContainer, Sector, Tooltip } from "recharts"

import {
  AvailableChartColors,
  type AvailableChartColorsKeys,
  constructCategoryColors,
  getColorClassName,
} from "@/lib/tremor/chartColors"
import { cn } from "@/lib/utils"

const sumNumericArray = (arr: number[]): number => arr.reduce((sum, num) => sum + num, 0)

const parseData = (data: Record<string, any>[], categoryColors: Map<string, AvailableChartColorsKeys>, category: string) =>
  data.map((dataPoint) => ({
    ...dataPoint,
    color: categoryColors.get(dataPoint[category]) || AvailableChartColors[0],
    className: getColorClassName(categoryColors.get(dataPoint[category]) || AvailableChartColors[0], "fill"),
  }))

const calculateDefaultLabel = (data: any[], valueKey: string): number =>
  sumNumericArray(data.map((dataPoint) => dataPoint[valueKey]))

const parseLabelInput = (labelInput: string | undefined, valueFormatter: (value: number) => string, data: any[], valueKey: string): string =>
  labelInput || valueFormatter(calculateDefaultLabel(data, valueKey))

type TooltipProps = Pick<ChartTooltipProps, "active" | "payload">

type PayloadItem = {
  category: string
  value: number
  color: AvailableChartColorsKeys
}

interface ChartTooltipProps {
  active: boolean | undefined
  payload: PayloadItem[]
  valueFormatter: (value: number) => string
}

const ChartTooltip = ({ active, payload, valueFormatter }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn("rounded-md border text-sm shadow-md", "border-gray-200 dark:border-gray-800", "bg-white dark:bg-gray-950")}>
        <div className="space-y-1 px-4 py-2">
          {payload.map(({ value, category, color }, index) => (
            <div key={`id-${index}`} className="flex items-center justify-between space-x-8">
              <div className="flex items-center space-x-2">
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", getColorClassName(color, "bg"))} />
                <p className="whitespace-nowrap text-right text-gray-700 dark:text-gray-300">{category}</p>
              </div>
              <p className="whitespace-nowrap text-right font-medium tabular-nums text-gray-900 dark:text-gray-50">
                {valueFormatter(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

type DonutChartVariant = "donut" | "pie"

type DonutChartEventProps = null | {
  eventType: "sector"
  categoryClicked: string
  [key: string]: number | string
}

interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  category: string
  value: string
  colors?: AvailableChartColorsKeys[]
  variant?: DonutChartVariant
  valueFormatter?: (value: number) => string
  label?: string
  showLabel?: boolean
  showTooltip?: boolean
  onValueChange?: (value: DonutChartEventProps) => void
  tooltipCallback?: (tooltipCallbackContent: TooltipProps) => void
  customTooltip?: React.ComponentType<TooltipProps>
}

const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>((props, ref) => {
  const {
    data = [],
    value,
    category,
    colors = AvailableChartColors,
    variant = "donut",
    valueFormatter = (value: number) => value.toString(),
    label,
    showLabel = false,
    showTooltip = true,
    onValueChange,
    tooltipCallback,
    customTooltip,
    className,
    ...other
  } = props

  const CustomTooltip = customTooltip
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)
  const isDonut = variant === "donut"
  const parsedLabelInput = parseLabelInput(label, valueFormatter, data, value)
  const categoryColors = constructCategoryColors(data.map((d) => d[category]), colors)
  const parsedData = parseData(data, categoryColors, category)

  const handleShapeClick = (data: any, index: number, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!onValueChange) return
    if (activeIndex === index) {
      setActiveIndex(undefined)
      onValueChange(null)
    } else {
      setActiveIndex(index)
      onValueChange({ eventType: "sector", categoryClicked: data.payload[category], ...data.payload })
    }
  }

  return (
    <div ref={ref} className={cn("relative w-full", className)} data-tremor-id="tremor-raw" {...other}>
      {isDonut && showLabel && parsedLabelInput && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--foreground)' }}>
            {parsedLabelInput}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ReChartsDonutChart
          onClick={onValueChange && activeIndex !== undefined ? (e: any) => { if (!e) { setActiveIndex(undefined); onValueChange(null) } } : undefined}
          margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {showTooltip && (
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const cleanPayload: PayloadItem[] = payload ? payload.map((item: any) => ({
                  category: item.payload[category],
                  value: item.value,
                  color: categoryColors.get(item.payload[category]) as AvailableChartColorsKeys,
                })) : []
                tooltipCallback?.({ active, payload: cleanPayload })
                if (CustomTooltip) return <CustomTooltip active={active} payload={cleanPayload} />
                return <ChartTooltip active={active} payload={cleanPayload} valueFormatter={valueFormatter} />
              }}
            />
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Pie
            {...({
              className: cn("stroke-white dark:stroke-gray-950", onValueChange ? "cursor-pointer" : "cursor-default"),
              data: parsedData,
              cx: "50%",
              cy: "50%",
              startAngle: 90,
              endAngle: -270,
              innerRadius: isDonut ? "75%" : "0%",
              outerRadius: "100%",
              stroke: "",
              strokeLinejoin: "round",
              dataKey: value,
              nameKey: category,
              isAnimationActive: false,
              onClick: onValueChange ? handleShapeClick : undefined,
              activeIndex,
              activeShape: (props: any) => <Sector {...props} outerRadius={props.outerRadius + 4} />,
            } as any)}
          />
        </ReChartsDonutChart>
      </ResponsiveContainer>
    </div>
  )
})
DonutChart.displayName = "DonutChart"

export { DonutChart, type DonutChartEventProps, type TooltipProps }
