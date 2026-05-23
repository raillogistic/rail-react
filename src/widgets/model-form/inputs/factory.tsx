import type { FieldRendererComponent, FormInputType } from "./types";
import TextInput from "./text";
import NumberInput from "./numbers";
import DecimalInput from "./decimal";
import ChoiceInput from "./choices";
import BooleanInput from "./boolean";
import DateInput from "./date";
import DateTimeInput from "./datetime";
import TimeInput from "./time";
import QueryChoiceInput from "./query";
import RichTextInput from "./rich-text";
import JsonNestedInput from "./json-nested";

type Registry = Partial<Record<FormInputType, FieldRendererComponent>>;

const registry: Registry = {
 text: TextInput,
 textarea: TextInput,
 email: TextInput,
 password: TextInput,
 color: TextInput,
 json: TextInput,
 "json-nested": JsonNestedInput,
 file: TextInput,
 "rich-text": RichTextInput,
 number: NumberInput,
 decimal: DecimalInput,
 slider: NumberInput,
 range: NumberInput,
 select: ChoiceInput,
 radio: ChoiceInput,
 checkbox: BooleanInput,
 switch: BooleanInput,
 date: DateInput,
 "datetime-local": DateTimeInput,
 time: TimeInput,
 "select-query": QueryChoiceInput,
};

export function registerInputRenderer(
 type: FormInputType,
 component: FieldRendererComponent,
) {
 registry[type] = component;
}

export function resolveInputComponent(
 type: FormInputType,
): FieldRendererComponent | undefined {
 return registry[type];
}
