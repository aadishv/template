import React, {
  useRef,
  useEffect,
  forwardRef,
  TextareaHTMLAttributes,
} from "react";

type AutoResizingTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const AutoResizingTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoResizingTextareaProps
>(({ style, onInput, ...props }, ref) => {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  // Merge forwarded ref and local ref
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(innerRef.current);
    } else {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
        innerRef.current;
    }
  }, [ref]);

  // Autosize on value change
  useEffect(() => {
    const textarea = innerRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(32, textarea.scrollHeight)}px`;
    }
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={innerRef}
      style={{
        minHeight: 32,
        height: 32,
        resize: "none",
        overflowY: "hidden",
        ...style,
      }}
      onInput={(e) => {
        const textarea = e.currentTarget;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.max(32, textarea.scrollHeight)}px`;
        onInput?.(e);
      }}
    />
  );
});

export default AutoResizingTextarea;
