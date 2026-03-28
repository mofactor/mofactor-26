"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ButtonGroup } from "@/components/ui/ButtonGroup";

interface NumberButtonsProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function NumberButtons({ value, onChange, min, max }: NumberButtonsProps) {
  return (
    <ButtonGroup>
      <Button
        variant="outline"
        size="icon-sm"
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={min != null && value <= min}
      >
        <Minus className="size-3" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const n = parseInt(e.target.value);
          if (!isNaN(n)) {
            const clamped = Math.min(max ?? n, Math.max(min ?? n, n));
            onChange(clamped);
          }
        }}
        size="sm"
        className="w-10 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
        min={min}
        max={max}
      />
      <Button
        variant="outline"
        size="icon-sm"
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={max != null && value >= max}
      >
        <Plus className="size-3" />
      </Button>
    </ButtonGroup>
  );
}
