import "./Button.css";
import { splitProps, type Component, type JSXElement } from "solid-js";

type TButtonType = "close" | "back" | "search" | "add" | "save" | "history" | "youtube";

const Button: Component<{
  disabled?: boolean;
  callback: () => void | Promise<void> | boolean;
  children?: JSXElement;
  class?: string;
  buttonType?: TButtonType;
}> = (props) => {
  const [s, p] = splitProps(props, ["disabled"]);
  const buttonClass = () => (p.class ? `${p.class} app-button` : "app-button");
  const buttonIcon = () => {
    const path = `/images/${p.buttonType}.svg`;
    return <img src={path} alt={p.buttonType} />;
  };

  return (
    <button class={buttonClass()} disabled={s.disabled} onclick={p.callback}>
      {s.disabled ? (
        <img src="/images/loading.svg" alt="loading" />
      ) : (
        props.children || buttonIcon()
      )}
    </button>
  );
};

export { Button };
