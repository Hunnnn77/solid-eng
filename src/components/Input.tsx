import "./Input.css";
import { mergeProps, Show, splitProps, type Component, type Setter } from "solid-js";

interface TInput {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  setter: Setter<string>;
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
  const [s, p] = splitProps(ps, ["isTextArea"]);

  return (
    <Show when={s.isTextArea} fallback={<InputField {...p} />}>
      <TextArea {...p} />
    </Show>
  );
};

const InputField: Component<TInput> = (props) => {
  const [s, p] = splitProps(props, ["disabled", "value"]);
  const mp = mergeProps({ disabled: false }, s);

  return (
    <div class="input-control">
      <input
        class="input-field"
        disabled={mp.disabled}
        value={s.value}
        type="text"
        placeholder={p.placeholder}
        oninput={(e) => p.setter(e.target.value)}
      />
    </div>
  );
};

const TextArea: Component<TInput> = (props) => {
  const [s, p] = splitProps(props, ["disabled", "value"]);
  const mp = mergeProps({ disabled: false }, s);

  return (
    <div class="input-control input-control--stack">
      <textarea
        class="input-field input-field--textarea"
        disabled={mp.disabled}
        value={s.value}
        placeholder={p.placeholder}
        oninput={(e) => p.setter(e.target.value)}
      />
    </div>
  );
};

export { Input };
