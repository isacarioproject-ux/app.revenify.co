import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-shimmer bg-gradient-to-r from-gray-100/40 via-gray-100/60 to-gray-100/40 dark:from-gray-800/20 dark:via-gray-800/40 dark:to-gray-800/20 rounded-md",
        "bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
