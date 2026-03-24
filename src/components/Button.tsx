import type { Component } from "solid-js";
import "./Button.css";

const Button: Component<{
  disabled?: boolean;
  collect: () => Promise<void>;
}> = (props) => {
  return (
    <button class="app-button" type="button" disabled={props.disabled} onclick={props.collect}>
      {props.disabled ? "Working..." : "Submit"}
    </button>
  );
};

export { Button };
