import { Badge } from "@/components/ui/Badge";

interface ProjectMetaItem {
  label: string;
  value: string;
  asBadges?: boolean;
}

interface ProjectMetaProps {
  items: ProjectMetaItem[];
  className?: string;
  variant?: "stack" | "grid";
}

function MetaValue({ item }: { item: ProjectMetaItem }) {
  if (item.asBadges) {
    return (
      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.value.split(",").map((v) => (
          <Badge key={v.trim()} variant="secondary" size="md">{v.trim()}</Badge>
        ))}
      </div>
    );
  }
  return <p>{item.value}</p>;
}

export default function ProjectMeta({ items, className = "", variant = "stack" }: ProjectMetaProps) {
  if (variant === "grid") {
    return (
      <div className={`flex flex-col md:grid md:grid-cols-2 gap-3 ${className}`}>
        {items.map((item, i) => (
          <div
            key={item.label}
            className={`space-y-2.5 leading-[1.5] p-6 rounded-lg bg-white/95 dark:bg-background/88 backdrop-blur-xl ${i === items.length - 1 && items.length % 2 !== 0 ? "col-span-2" : ""
              }`}
          >
            <p className="text-muted-foreground uppercase tracking-wider text-xs font-medium">
              {item.label}
            </p>
            <MetaValue item={item} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={` space-y-8 p-8 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="space-y-2.5 leading-[1.5]">
          <p className="text-muted-foreground uppercase tracking-wider text-xs font-medium">
            {item.label}
          </p>
          <MetaValue item={item} />
        </div>
      ))}
    </div>
  );
}
