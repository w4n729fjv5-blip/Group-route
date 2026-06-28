import { DELIVERY_DAYS, type DeliveryDay } from "../types";

interface Props {
  value: DeliveryDay | null;
  onChange: (day: DeliveryDay | null) => void;
}

const SHORT: Record<DeliveryDay, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

/** Weekday picker shown as a row of toggle chips. */
export default function DaySelector({ value, onChange }: Props) {
  return (
    <div className="day-selector" role="group" aria-label="Delivery day">
      {DELIVERY_DAYS.map((day) => {
        const selected = value === day;
        return (
          <button
            key={day}
            type="button"
            className={`day-chip${selected ? " selected" : ""}`}
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : day)}
          >
            {SHORT[day]}
          </button>
        );
      })}
    </div>
  );
}
