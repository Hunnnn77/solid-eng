import type { Component, JSXElement } from "solid-js";
import "./Button.css";

const Button: Component<{
  disabled?: boolean;
  callback: () => void | Promise<void>;
  children?: JSXElement;
}> = (props) => {
  return (
    <button class="app-button" type="button" disabled={props.disabled} onclick={props.callback}>
      {props.disabled ? "Working..." : props.children || "submit"}
    </button>
  );
};

export { Button };
