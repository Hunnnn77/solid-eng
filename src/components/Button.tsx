import "./Button.css";
import { children, splitProps, type Component, type JSXElement } from "solid-js";

const Button: Component<{
  disabled?: boolean;
  callback: () => void | Promise<void> | boolean;
  children?: JSXElement;
  class?: string;
}> = (props) => {
  const c = children(() => props.children);
  const [s, p] = splitProps(props, ["disabled"]);
  const buttonClass = () => `${p.class} app-button`;

  return (
    <button class={buttonClass()} disabled={s.disabled} onclick={p.callback}>
      {s.disabled ? "Working..." : c() || "submit"}
    </button>
  );
};

export { Button };
