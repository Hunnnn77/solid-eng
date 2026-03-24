import { mergeProps, Show, splitProps, type Component } from "solid-js";
import "./Input.css";

interface TInput {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  setter: (s: string) => void;
}

const Input: Component<
  {
    isTextArea?: boolean;
  } & TInput
> = (props) => {
  const ps = mergeProps(
    {
      isTextArea: false,
      placeholder: "",
    },
    props,
  );
  const [is, p] = splitProps(ps, ["isTextArea"]);

  return (
    <Show when={is.isTextArea} fallback={<InputField {...p} />}>
      <TextArea {...p} />
    </Show>
  );
};

const InputField: Component<TInput> = (props) => {
  const [s, p] = splitProps(props, ["value", "placeholder"]);

  return (
    <div class="input-row">
      <input
        class="field-input"
        disabled={p.disabled}
        value={s.value}
        type="text"
        placeholder={s.placeholder}
        oninput={(e) => p.setter(e.target.value)}
      />
    </div>
  );
};

const TextArea: Component<TInput> = (props) => {
  const [s, p] = splitProps(props, ["value", "placeholder"]);

  return (
    <div class="input-row input-row-stack">
      <textarea
        class="field-input field-textarea"
        disabled={p.disabled}
        value={s.value}
        placeholder={s.placeholder}
        oninput={(e) => p.setter(e.target.value)}
      />
    </div>
  );
};

export { Input };
