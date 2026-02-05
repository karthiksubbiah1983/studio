"use client"

import * as React from "react"

const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    {...props}
  />
))
Command.displayName = "Command"

export { Command }
