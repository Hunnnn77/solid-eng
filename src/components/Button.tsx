import "./Button.css";
import { children, splitProps, type Component, type JSXElement } from "solid-js";

const Button: Component<{
  disabled?: boolean;
  callback: () => void | Promise<void>;
  children?: JSXElement;
}> = (props) => {
  const c = children(() => props.children);
  const [s, p] = splitProps(props, ["disabled"]);

  return (
    <button class="app-button" type="button" disabled={s.disabled} onclick={p.callback}>
      {s.disabled ? "Working..." : c() || "submit"}
    </button>
  );
};

export { Button };
