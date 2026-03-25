import {
  createComputed,
  createSignal,
  mergeProps,
  splitProps,
  type Component,
  type JSXElement,
} from "solid-js";
import "./Button.css";

const Button: Component<{
  disabled?: boolean;
  callback: () => void | Promise<void>;
  children?: JSXElement;
}> = (props) => {
  const [s, p] = splitProps(props, ["disabled"]);
  const mp = mergeProps({ disabled: false }, s);
  const [disabled, setDisabled] = createSignal(false);

  createComputed(() => {
    setDisabled(mp.disabled);
  });

  return (
    <button class="app-button" type="button" disabled={mp.disabled} onclick={p.callback}>
      {disabled() ? "Working..." : p.children || "submit"}
    </button>
  );
};

export { Button };
