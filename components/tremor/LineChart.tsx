// Tremor LineChart [v1.0.0] — copy-paste component with local utils
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from "react"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"
import {
  CartesianGrid,
  Dot,
  Label,
  Line,
  Legend as RechartsLegend,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { AxisDomain } from "recharts/types/util/types"

import { useOnWindowResize } from "@/lib/tremor/useOnWindowResize"
import {
  AvailableChartColors,
  type AvailableChartColorsKeys,
  constructCategoryColors,
  getColorClassName,
} from "@/lib/tremor/chartColors"
import { cn } from "@/lib/utils"
import { getYAxisDomain, hasOnlyOneValueForKey } from "@/lib/tremor/chartUtils"

//#region Legend

interface LegendItemProps {
  name: string
  color: AvailableChartColorsKeys
  onClick?: (name: string, color: AvailableChartColorsKeys) => void
  activeLegend?: string
}

const LegendItem = ({ name, color, onClick, activeLegend }: LegendItemProps) => {
  const hasOnValueChange = !!onClick
  return (
    <li
      className={cn(
        "group inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-1 transition",
        hasOnValueChange ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" : "cursor-default",
      )}
      onClick={(e) => { e.stopPropagation(); onClick?.(name, color) }}
    >
      <span
        className={cn(
          "h-[3px] w-3.5 shrink-0 rounded-full",
          getColorClassName(color, "bg"),
          activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100",
        )}
        aria-hidden
      />
      <p className={cn(
        "truncate whitespace-nowrap text-xs text-gray-700 dark:text-gray-300",
        hasOnValueChange && "group-hover:text-gray-900 dark:group-hover:text-gray-50",
        activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100",
      )}>
        {name}
      </p>
    </li>
  )
}

interface ScrollButtonProps {
  icon: React.ElementType
  onClick?: () => void
  disabled?: boolean
}

const ScrollButton = ({ icon: Icon, onClick, disabled }: ScrollButtonProps) => {
  const [isPressed, setIsPressed] = React.useState(false)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (isPressed) intervalRef.current = setInterval(() => { onClick?.() }, 300)
    else clearInterval(intervalRef.current as NodeJS.Timeout)
    return () => clearInterval(intervalRef.current as NodeJS.Timeout)
  }, [isPressed, onClick])

  React.useEffect(() => {
    if (disabled) { clearInterval(intervalRef.current as NodeJS.Timeout); setIsPressed(false) }
  }, [disabled])

  return (
    <button
      type="button"
      className={cn(
        "group inline-flex size-5 items-center truncate rounded transition",
        disabled ? "cursor-not-allowed text-gray-400 dark:text-gray-600" : "cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50",
      )}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onMouseDown={(e) => { e.stopPropagation(); setIsPressed(true) }}
      onMouseUp={(e) => { e.stopPropagation(); setIsPressed(false) }}
    >
      <Icon className="size-full" aria-hidden />
    </button>
  )
}

interface LegendProps extends React.OlHTMLAttributes<HTMLOListElement> {
  categories: string[]
  colors?: AvailableChartColorsKeys[]
  onClickLegendItem?: (category: string, color: AvailableChartColorsKeys) => void
  activeLegend?: string
  enableLegendSlider?: boolean
}

interface ScrollState { left: boolean; right: boolean }

const Legend = React.forwardRef<HTMLOListElement, LegendProps>((props, ref) => {
  const { categories, colors = AvailableChartColors, onClickLegendItem, activeLegend, enableLegendSlider = false, className, ...other } = props
  const scrollableRef = React.useRef<HTMLOListElement>(null)
  const scrollButtonsRef = React.useRef<HTMLDivElement>(null)
  const [hasScroll, setHasScroll] = React.useState<ScrollState | undefined>(undefined)
  const [isKeyDowned, setIsKeyDowned] = React.useState<string | null>(null)
  const categoryColors = constructCategoryColors(categories, colors)

  const checkScroll = React.useCallback(() => {
    const scrollable = scrollableRef?.current
    if (!scrollable) return
    const hasLeftScroll = scrollable.scrollLeft > 0
    const hasRightScroll = scrollable.scrollWidth - scrollable.clientWidth > scrollable.scrollLeft
    setHasScroll({ left: hasLeftScroll, right: hasRightScroll })
  }, [])

  const scrollToTest = React.useCallback((direction: "left" | "right") => {
    const element = scrollableRef?.current
    const width = element?.clientWidth ?? 0
    if (element && enableLegendSlider) {
      element.scrollBy({ left: direction === "left" ? -width : width, behavior: "smooth" })
      setTimeout(() => checkScroll(), 400)
    }
  }, [enableLegendSlider, checkScroll])

  useOnWindowResize(checkScroll)

  React.useEffect(() => {
    const timer = setTimeout(() => checkScroll(), 400)
    return () => clearTimeout(timer)
  }, [checkScroll])

  React.useEffect(() => {
    if (isKeyDowned) {
      scrollToTest(isKeyDowned as "left" | "right")
      const timer = setTimeout(() => setIsKeyDowned(null), 300)
      return () => clearTimeout(timer)
    }
  }, [isKeyDowned, scrollToTest])

  const keyDown = (e: React.KeyboardEvent<HTMLOListElement>) => {
    e.stopPropagation()
    if (e.key === "ArrowLeft") { e.preventDefault(); setIsKeyDowned("left") }
    else if (e.key === "ArrowRight") { e.preventDefault(); setIsKeyDowned("right") }
  }
  const keyUp = (e: React.KeyboardEvent<HTMLOListElement>) => { e.stopPropagation(); setIsKeyDowned(null) }

  return (
    <ol ref={ref} className={cn("relative overflow-hidden", className)} {...other}>
      <div ref={scrollButtonsRef} className={cn("absolute left-0 top-0 flex h-full items-center justify-center pr-0.5", enableLegendSlider && hasScroll?.left ? "visible" : "hidden")}>
        <ScrollButton icon={RiArrowLeftSLine} onClick={() => scrollToTest("left")} disabled={!hasScroll?.left} />
      </div>
      <ol
        ref={scrollableRef}
        tabIndex={0}
        onKeyDown={keyDown}
        onKeyUp={keyUp}
        className={cn(
          "flex h-full",
          enableLegendSlider ? cn("snap-mandatory items-center overflow-auto pl-4 pr-12", "[&::-webkit-scrollbar]:hidden") : "flex-wrap",
        )}
      >
        {categories.map((category, i) => (
          <LegendItem
            key={`item-${i}`}
            name={category}
            color={categoryColors.get(category) as AvailableChartColorsKeys}
            onClick={onClickLegendItem}
            activeLegend={activeLegend}
          />
        ))}
      </ol>
      <div className={cn("absolute right-0 top-0 flex h-full items-center justify-center pl-0.5", enableLegendSlider && hasScroll?.right ? "visible" : "hidden")}>
        <ScrollButton icon={RiArrowRightSLine} onClick={() => scrollToTest("right")} disabled={!hasScroll?.right} />
      </div>
    </ol>
  )
})
Legend.displayName = "Legend"

//#region Tooltip

type TooltipProps = Pick<ChartTooltipProps, "active" | "payload">

type PayloadItem = {
  category: string
  value: number
  index: string
  color: AvailableChartColorsKeys
  type?: string
  payload: any
}

interface ChartTooltipProps {
  active: boolean | undefined
  payload: PayloadItem[]
  label: string
  valueFormatter: (value: number) => string
}

const ChartTooltip = ({ active, payload, label, valueFormatter }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn("rounded-md border text-sm shadow-md", "border-gray-200 dark:border-gray-800", "bg-white dark:bg-gray-950")}>
        <div className="border-b border-inherit px-4 py-2">
          <p className="font-medium text-gray-900 dark:text-gray-50">{label}</p>
        </div>
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

//#region LineChart

type ActiveDot = { index?: number; dataKey?: string }

type LineChartEventProps = null | {
  eventType: "dot" | "category"
  categoryClicked: string
  [key: string]: number | string
}

interface LineChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  index: string
  categories: string[]
  colors?: AvailableChartColorsKeys[]
  valueFormatter?: (value: number) => string
  startEndOnly?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showGridLines?: boolean
  yAxisWidth?: number
  intervalType?: "preserveStartEnd" | "equidistantPreserveStart"
  showTooltip?: boolean
  showLegend?: boolean
  autoMinValue?: boolean
  minValue?: number
  maxValue?: number
  allowDecimals?: boolean
  onValueChange?: (value: LineChartEventProps) => void
  enableLegendSlider?: boolean
  tickGap?: number
  connectNulls?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
  legendPosition?: "left" | "center" | "right"
  tooltipCallback?: (tooltipCallbackContent: TooltipProps) => void
  customTooltip?: React.ComponentType<TooltipProps>
}

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>((props, ref) => {
  const {
    data = [],
    categories = [],
    index,
    colors = AvailableChartColors,
    valueFormatter = (value: number) => value.toString(),
    startEndOnly = false,
    showXAxis = true,
    showYAxis = true,
    showGridLines = true,
    yAxisWidth = 56,
    intervalType = "equidistantPreserveStart",
    showTooltip = true,
    showLegend = true,
    autoMinValue = false,
    minValue,
    maxValue,
    allowDecimals = true,
    connectNulls = false,
    className,
    onValueChange,
    enableLegendSlider = false,
    tickGap = 5,
    xAxisLabel,
    yAxisLabel,
    legendPosition = "right",
    tooltipCallback,
    customTooltip,
    ...other
  } = props

  const CustomTooltip = customTooltip
  const paddingValue = (!showXAxis && !showYAxis) || (startEndOnly && !showYAxis) ? 0 : 20
  const [legendHeight, setLegendHeight] = React.useState(60)
  const [activeDot, setActiveDot] = React.useState<ActiveDot | undefined>(undefined)
  const [activeLegend, setActiveLegend] = React.useState<string | undefined>(undefined)
  const categoryColors = constructCategoryColors(categories, colors)
  const yAxisDomain = getYAxisDomain(autoMinValue, minValue, maxValue)
  const hasOnValueChange = !!onValueChange

  function onDotClick(itemData: any, event: React.MouseEvent) {
    event.stopPropagation()
    if (!hasOnValueChange) return
    if (deepEqual(activeDot, { index: itemData.index, dataKey: itemData.dataKey })) {
      setActiveLegend(undefined)
      setActiveDot(undefined)
      onValueChange?.(null)
    } else {
      setActiveLegend(itemData.dataKey)
      setActiveDot({ index: itemData.index, dataKey: itemData.dataKey })
      onValueChange?.({ eventType: "dot", categoryClicked: itemData.dataKey, ...itemData.payload })
    }
  }

  function onCategoryClick(dataKey: string) {
    if (!hasOnValueChange) return
    if (dataKey === activeLegend && !activeDot) {
      setActiveLegend(undefined)
      onValueChange?.(null)
    } else {
      setActiveLegend(dataKey)
      onValueChange?.({ eventType: "category", categoryClicked: dataKey })
    }
    setActiveDot(undefined)
  }

  return (
    <div ref={ref} className={cn("w-full", className)} data-tremor-id="tremor-raw" {...other}>
      <ResponsiveContainer>
        <RechartsLineChart
          data={data}
          onClick={hasOnValueChange && (activeLegend || activeDot) ? () => { setActiveDot(undefined); setActiveLegend(undefined); onValueChange?.(null) } : undefined}
          margin={{ bottom: xAxisLabel ? 30 : undefined, left: yAxisLabel ? 20 : undefined, right: paddingValue, top: 5 }}
        >
          {showGridLines && (
            <CartesianGrid className="stroke-gray-200 stroke-1 dark:stroke-gray-800" horizontal vertical={false} />
          )}
          <XAxis
            padding={{ left: paddingValue, right: paddingValue }}
            hide={!showXAxis}
            dataKey={index}
            interval={startEndOnly ? "preserveStartEnd" : intervalType}
            tick={{ transform: "translate(0, 6)" }}
            ticks={startEndOnly && data.length > 0 ? [data[0][index], data[data.length - 1][index]] : undefined}
            fill=""
            stroke=""
            className="text-xs text-gray-500 dark:text-gray-500"
            tickLine={false}
            axisLine={false}
            minTickGap={tickGap}
          >
            {xAxisLabel && (
              <Label position="insideBottom" offset={-20} className="fill-gray-800 text-sm font-medium dark:fill-gray-200">
                {xAxisLabel}
              </Label>
            )}
          </XAxis>
          <YAxis
            width={yAxisWidth}
            hide={!showYAxis}
            axisLine={false}
            tickLine={false}
            fill=""
            stroke=""
            className="text-xs text-gray-500 dark:text-gray-500"
            tickFormatter={valueFormatter}
            allowDecimals={allowDecimals}
            domain={yAxisDomain as AxisDomain}
          >
            {yAxisLabel && (
              <Label angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} offset={-15} className="fill-gray-800 text-sm font-medium dark:fill-gray-200">
                {yAxisLabel}
              </Label>
            )}
          </YAxis>
          <Tooltip
            wrapperStyle={{ outline: "none" }}
            isAnimationActive={true}
            animationDuration={100}
            cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
            offset={20}
            position={{ y: 0 }}
            content={({ active, payload, label }) => {
              const cleanPayload: PayloadItem[] = payload ? payload.map((item: any) => ({
                category: item.dataKey,
                value: item.value,
                index: item.payload[index],
                color: categoryColors.get(item.dataKey) as AvailableChartColorsKeys,
                type: item.type,
                payload: item.payload,
              })) : []
              tooltipCallback?.({ active, payload: cleanPayload })
              if (CustomTooltip) return <CustomTooltip active={active} payload={cleanPayload} />
              return showTooltip ? <ChartTooltip active={active} payload={cleanPayload} label={String(label ?? '')} valueFormatter={valueFormatter} /> : null
            }}
          />
          {showLegend && (
            <RechartsLegend
              verticalAlign="top"
              height={legendHeight}
              content={({ payload }) => (
                <ChartLegendContent
                  payload={payload ? [...payload] : []}
                  categoryColors={categoryColors}
                  setLegendHeight={setLegendHeight}
                  activeLegend={activeLegend}
                  hasOnValueChange={hasOnValueChange}
                  onCategoryClick={onCategoryClick}
                  enableLegendSlider={enableLegendSlider}
                  legendPosition={legendPosition}
                />
              )}
            />
          )}
          {categories.map((category) => (
            <Line
              className={cn(getColorClassName(categoryColors.get(category) as AvailableChartColorsKeys, "stroke"))}
              strokeOpacity={activeLegend && activeLegend !== category ? 0.3 : 1}
              activeDot={(props: any) => {
                const { cx: cxVal, cy: cyVal, stroke, strokeLinecap, strokeLinejoin, strokeWidth, dataKey } = props
                return (
                  <Dot
                    className={cn("stroke-white dark:stroke-gray-950", onValueChange ? "cursor-pointer" : "", getColorClassName(categoryColors.get(dataKey) as AvailableChartColorsKeys, "fill"))}
                    cx={cxVal} cy={cyVal} r={5}
                    stroke={stroke} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} strokeWidth={strokeWidth}
                    onClick={(_, event) => onDotClick(props, event)}
                  />
                )
              }}
              dot={(props: any) => {
                const { stroke, strokeLinecap, strokeLinejoin, strokeWidth, cx: cxVal, cy: cyVal, dataKey, index: dIdx } = props
                if ((hasOnlyOneValueForKey(data, category) && !(activeDot || (activeLegend && activeLegend !== category))) || (activeDot?.index === dIdx && activeDot?.dataKey === category)) {
                  return (
                    <Dot
                      key={dIdx}
                      className={cn("stroke-white dark:stroke-gray-950", onValueChange ? "cursor-pointer" : "", getColorClassName(categoryColors.get(dataKey) as AvailableChartColorsKeys, "fill"))}
                      cx={cxVal} cy={cyVal} r={5}
                      stroke={stroke} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} strokeWidth={strokeWidth}
                    />
                  )
                }
                return <React.Fragment key={dIdx} />
              }}
              key={category}
              name={category}
              type="linear"
              dataKey={category}
              stroke=""
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              isAnimationActive={false}
              connectNulls={connectNulls}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
})
LineChart.displayName = "LineChart"

function deepEqual<T>(obj1: T, obj2: T, visited = new Set<unknown>()): boolean {
  if (obj1 === obj2) return true
  if (typeof obj1 !== "object" || typeof obj2 !== "object" || obj1 === null || obj2 === null) return false
  if (visited.has(obj1)) return true
  visited.add(obj1)
  const keys1 = Object.keys(obj1) as Array<keyof T>
  if (keys1.length !== Object.keys(obj2 as object).length) return false
  for (const key of keys1) {
    if (!deepEqual(obj1[key], (obj2 as any)[key], visited)) return false
  }
  return true
}

interface ChartLegendContentProps {
  payload: any[]
  categoryColors: Map<string, AvailableChartColorsKeys>
  setLegendHeight: (height: number) => void
  activeLegend: string | undefined
  hasOnValueChange: boolean
  onCategoryClick: (dataKey: string) => void
  enableLegendSlider: boolean
  legendPosition: "left" | "center" | "right"
}

// Must be a proper React component (not a plain function) because it calls useOnWindowResize
const ChartLegendContent = React.memo(function ChartLegendContent({
  payload,
  categoryColors,
  setLegendHeight,
  activeLegend,
  hasOnValueChange,
  onCategoryClick,
  enableLegendSlider,
  legendPosition,
}: ChartLegendContentProps) {
  const legendRef = React.useRef<HTMLDivElement>(null)
  useOnWindowResize(React.useCallback(() => {
    const height = legendRef.current?.clientHeight
    setLegendHeight(height ? Number(height) + 15 : 60)
  }, [setLegendHeight]))

  if (!payload) return null
  return (
    <div
      ref={legendRef}
      className={cn("flex items-center", {
        "justify-start":  legendPosition === "left",
        "justify-center": legendPosition === "center",
        "justify-end":    legendPosition === "right",
      })}
    >
      <Legend
        categories={payload.map((entry: any) => entry.value)}
        colors={payload.map((entry: any) => categoryColors.get(entry.value)).filter((c): c is AvailableChartColorsKeys => !!c)}
        onClickLegendItem={hasOnValueChange ? onCategoryClick : undefined}
        activeLegend={activeLegend}
        enableLegendSlider={enableLegendSlider}
      />
    </div>
  )
})

export { LineChart, type LineChartEventProps, type TooltipProps }
