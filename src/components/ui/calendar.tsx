"use client"

import * as React from "react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import { ptBR } from "react-day-picker/locale"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("acam-calendar", className)}
      classNames={{
        months: "acam-calendar-months",
        month: "acam-calendar-month",
        month_caption: "acam-calendar-caption",
        caption_label: "acam-calendar-caption-label",
        nav: "acam-calendar-nav",
        button_previous: "acam-calendar-nav-btn acam-calendar-nav-prev",
        button_next: "acam-calendar-nav-btn acam-calendar-nav-next",
        month_grid: "acam-calendar-grid",
        weekdays: "acam-calendar-weekdays",
        weekday: "acam-calendar-weekday",
        week: "acam-calendar-week",
        day: "acam-calendar-day",
        day_button: "acam-calendar-day-btn",
        selected: "acam-calendar-selected",
        today: "acam-calendar-today",
        outside: "acam-calendar-outside",
        disabled: "acam-calendar-disabled",
        hidden: "acam-calendar-hidden",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
