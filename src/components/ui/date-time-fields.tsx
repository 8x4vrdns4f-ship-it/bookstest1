import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Mimics an input change event so existing `(e) => set(e.target.value)` handlers keep working. */
type FakeChange = { target: { value: string } };
const fake = (value: string): FakeChange => ({ target: { value } });

type DateFieldProps = {
  id?: string;
  value: string; // yyyy-MM-dd or ""
  onChange: (e: FakeChange) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

/** Calendar-based date picker. No typing, so half-typed dates can never break a form. */
export function DateField({ id, value, onChange, min, max, disabled, placeholder = "Pick a date", className }: DateFieldProps) {
  const [open, setOpen] = React.useState(false);
  const date = value ? parseISO(value) : undefined;
  const valid = date && isValid(date) ? date : undefined;
  const minD = min ? parseISO(min) : undefined;
  const maxD = max ? parseISO(max) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("justify-start text-left font-normal gap-2 bg-secondary border-border min-w-[150px]", !valid && "text-muted-foreground", className)}
        >
          <CalendarIcon size={15} className="shrink-0 opacity-70" />
          {valid ? format(valid, "EEE d MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={valid}
          defaultMonth={valid ?? minD}
          weekStartsOn={1}
          onSelect={(d) => {
            if (!d) return;
            onChange(fake(format(d, "yyyy-MM-dd")));
            setOpen(false);
          }}
          disabled={(d) => {
            const s = format(d, "yyyy-MM-dd");
            return (!!min && s < min) || (!!max && s > max);
          }}
          fromDate={minD}
          toDate={maxD}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, "0");
  const m = String((i % 4) * 15).padStart(2, "0");
  return `${h}:${m}`;
});

type TimeFieldProps = {
  id?: string;
  value: string; // HH:mm
  onChange: (e: FakeChange) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

/** Time picker with 15-minute steps; keeps any existing non-15-minute value selectable. */
export function TimeField({ id, value, onChange, disabled, className }: TimeFieldProps) {
  const v = (value || "").slice(0, 5);
  const options = v && !TIME_OPTIONS.includes(v) ? [...TIME_OPTIONS, v].sort() : TIME_OPTIONS;
  return (
    <Select value={v || undefined} onValueChange={(val) => onChange(fake(val))} disabled={disabled}>
      <SelectTrigger id={id} className={cn("w-[110px] bg-secondary border-border gap-1", className, "min-w-[104px]")}>
        <Clock size={14} className="shrink-0 opacity-60" />
        <SelectValue placeholder="--:--" />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((t) => (
          <SelectItem key={t} value={t}>{t}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type NumberFieldProps = Omit<React.ComponentProps<typeof Input>, "type" | "onChange" | "value"> & {
  value: number | string | null | undefined;
  onChange: (e: FakeChange) => void;
};

/**
 * Number box that lets you clear it and type freely. Parent only hears about
 * complete numbers; out-of-range values are clamped when you leave the box.
 */
export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ value, onChange, min, max, onBlur, ...rest }, ref) => {
    const ext = value === null || value === undefined ? "" : String(value);
    const [draft, setDraft] = React.useState(ext);
    const focused = React.useRef(false);
    React.useEffect(() => {
      if (!focused.current) setDraft(ext);
    }, [ext]);
    const lo = min !== undefined && min !== "" ? Number(min) : undefined;
    const hi = max !== undefined && max !== "" ? Number(max) : undefined;
    return (
      <Input
        ref={ref}
        {...rest}
        type="text"
        inputMode={String(rest.step ?? "").includes(".") ? "decimal" : "numeric"}
        value={draft}
        onFocus={(e) => { focused.current = true; rest.onFocus?.(e); }}
        onChange={(e) => {
          const t = e.target.value.replace(",", ".");
          if (!/^-?\d*\.?\d*$/.test(t)) return;
          setDraft(t);
          if (t !== "" && t !== "-" && t !== "." && !isNaN(Number(t))) onChange(fake(t));
          else if (t === "") onChange(fake(""));
        }}
        onBlur={(e) => {
          focused.current = false;
          let n = Number(draft);
          if (draft === "" || isNaN(n)) {
            if (lo !== undefined) { n = lo; } else { setDraft(ext); onBlur?.(e); return; }
          }
          if (lo !== undefined && n < lo) n = lo;
          if (hi !== undefined && n > hi) n = hi;
          setDraft(String(n));
          onChange(fake(String(n)));
          onBlur?.(e);
        }}
      />
    );
  },
);
NumberField.displayName = "NumberField";
