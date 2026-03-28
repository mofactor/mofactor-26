const tabBtn =
  "flex-1 cursor-pointer rounded-sm px-1.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all";
const activeTabs =
  "bg-white dark:bg-zinc-950 text-foreground shadow-border dark:shadow-none";
const inactiveTabs =
  "text-foreground/40 hover:text-foreground border-transparent bg-transparent dark:text-muted-foreground dark:hover:text-foreground";

export interface PresetTabsProps {
  /** Each inner array renders as one row of buttons. */
  rows: { value: string; label: string }[][];
  /** Currently active value — empty string means none active. */
  active: string;
  /** Fired when the user clicks a tab. */
  onSelect: (value: string) => void;
}

export function PresetTabs({ rows, active, onSelect }: PresetTabsProps) {
  const multiRow = rows.length > 1;
  return (
    <div
      className={`${multiRow ? "flex w-full flex-col gap-0.5" : "inline-flex w-full flex-wrap items-center"} rounded-md border border-zinc-200 bg-muted p-0.5 inset-shadow-xs dark:border-zinc-1000`}
    >
      {rows.map((row, i) => (
        <div key={i} className={multiRow ? "flex" : "contents"}>
          {row.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              className={`${tabBtn} ${active === item.value ? activeTabs : inactiveTabs} min-w-[44px]`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
