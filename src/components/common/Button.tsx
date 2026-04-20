import * as React from "react";
import { cn } from "../../utility/utils";

type MotionComponent = React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLElement> & Record<string, unknown>
>;

type AnyComponent = React.ElementType | MotionComponent;

type ButtonVariants =
  | "default"
  | "outline"
  | "ghost"
  | "secondary"
  | "accent"
  | "destructive";

type ButtonSizes = "sm" | "md" | "lg" | "icon";

type ButtonOwnProps = {
  variant?: ButtonVariants;
  size?: ButtonSizes;
  className?: string;
};

type PropsOf<T extends AnyComponent> = T extends React.ElementType
  ? React.ComponentPropsWithoutRef<T>
  : T extends React.ForwardRefExoticComponent<infer P>
    ? P
    : Record<string, unknown>;

export type ButtonProps<T extends AnyComponent = "button"> = ButtonOwnProps & {
  as?: T;
} & Omit<PropsOf<T>, keyof ButtonOwnProps | "as">;

type PolymorphicRef<T extends AnyComponent> = T extends React.ElementType
  ? React.ComponentPropsWithRef<T>["ref"]
  : React.Ref<HTMLButtonElement>;

const baseClasses = [
  "inline-flex items-center justify-center gap-2",
  "font-medium text-sm",
  "cursor-pointer select-none",
  "transition-all duration-150 ease-out",
  "active:scale-[0.96]",
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
  "focus-visible:ring-offset-white",
  "disabled:opacity-40 disabled:pointer-events-none disabled:select-none",
].join(" ");

const variantClasses: Record<ButtonVariants, string> = {
  default: "bg-[#1f2125] text-white hover:opacity-85",

  secondary: "bg-gray-100 text-[#1f2125] hover:bg-gray-200",

  outline:
    "border border-gray-300 text-[#1f2125] bg-transparent " +
    "hover:bg-gray-100 hover:text-blue-600",

  ghost:
    "text-[#1f2125] bg-transparent " + "hover:bg-gray-100 hover:text-gray-900",

  accent: "bg-violet-600 text-white hover:bg-violet-700",

  destructive: "bg-rose-600 text-white hover:bg-rose-700",
};

const sizeClasses: Record<ButtonSizes, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-base rounded-xl",
  icon: "size-10 rounded-xl",
};

const Button = React.forwardRef(
  <T extends AnyComponent = "button">(
    {
      as,
      variant = "default",
      size = "md",
      className,
      ...props
    }: ButtonProps<T>,
    ref?: PolymorphicRef<T>,
  ) => {
    const Comp = as ?? "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
) as <T extends AnyComponent = "button">(
  props: ButtonProps<T> & { ref?: PolymorphicRef<T> },
) => React.ReactElement | null;

(Button as unknown as { displayName: string }).displayName = "Button";

export default Button;
export type { ButtonVariants, ButtonSizes, AnyComponent };
