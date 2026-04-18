import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "memo-card": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "data-id"?: string;
        "data-name"?: string;
        "data-description"?: string;
        "data-image"?: string;
        "data-category"?: string;
        "data-level"?: string;
        "data-attack"?: string;
        "data-defense"?: string;
        "data-flipped"?: boolean | string;
        "data-interactive"?: boolean | string;
      };
    }
  }
}
