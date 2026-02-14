import { cn } from "@immersive-lang/shared/utils";
import { type LabelHTMLAttributes, forwardRef } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, required, children, ...props }, ref) => {
    return (
        <label
            ref={ref}
            className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                className,
            )}
            {...props}
        >
            {children}
            {required && <span className="text-danger ml-1">*</span>}
        </label>
    );
});

Label.displayName = "Label";
