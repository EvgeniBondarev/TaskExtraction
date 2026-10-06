import { ImgHTMLAttributes, ReactNode, useState } from "react";
import { Skeleton } from "./Skeleton";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
  fallback?: ReactNode;
};

/** Keeps an image's footprint stable and uses the app skeleton until it is ready. */
export function ImageWithSkeleton({
  wrapperClassName = "",
  className = "",
  fallback = null,
  onLoad,
  onError,
  ...props
}: Props) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const isLoading = state === "loading";

  return (
    <span className={`image-with-skeleton ${wrapperClassName}`.trim()} aria-busy={isLoading || undefined}>
      {isLoading && <Skeleton className="image-with-skeleton__placeholder" radius="inherit" />}
      {state !== "error" && (
        <img
          {...props}
          className={`image-with-skeleton__image ${isLoading ? "is-loading" : "is-ready"} ${className}`.trim()}
          onLoad={(event) => {
            setState("ready");
            onLoad?.(event);
          }}
          onError={(event) => {
            setState("error");
            onError?.(event);
          }}
        />
      )}
      {state === "error" && fallback}
    </span>
  );
}
