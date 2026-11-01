import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, onWheel, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        // input[type=number] incrementa/decrementa o valor ao rolar o mouse
        // por cima enquanto focado — tira o foco pra evitar mudança sem querer
        onWheel={type === 'number' ? (e) => { e.currentTarget.blur(); onWheel?.(e) } : onWheel}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
