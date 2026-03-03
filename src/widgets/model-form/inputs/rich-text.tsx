import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/shared/utils";
import { Toggle } from "@/shared/ui/kit/toggle";
import {
 Bold,
 Italic,
 Strikethrough,
 Code,
 List,
 ListOrdered,
 Heading1,
 Quote,
 Undo,
 Redo,
 Link as LinkIcon,
} from "lucide-react";
import { FieldWrapper, resolveFieldErrors, resolveRequiredError } from "./common";
import type { FieldComponentProps, RichTextFieldConfig } from "./types";
import { useStore } from "@tanstack/react-form";

type Props = FieldComponentProps<RichTextFieldConfig>;

const RichTextInput: React.FC<Props> = ({ config, field, form }) => {
 const meta = field.state.meta;
 const dirty = meta.isDirty;
 const submitCount = useStore(
 form.store,
 (state) => (state as any).submissionAttempts ?? (state as any).submitCount ?? 0
 );
 const isSubmitted = submitCount > 0;
 const showError =
 dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
 const fieldErrors = resolveFieldErrors(meta, showError);
 const error =
 fieldErrors ?? resolveRequiredError(config, field.state.value, showError);

 const fieldId = field.name;

 const editor = useEditor({
 extensions: [
 StarterKit,
 Link.configure({
 openOnClick: false,
 }),
 Placeholder.configure({
 placeholder: config.placeholder ?? "Écrivez quelque chose...",
 }),
 ],
 content: (field.state.value as string) ?? "",
 editable: !config.disabled && !config.readOnly,
 onUpdate: ({ editor }) => {
 const html = editor.getHTML();
 // If empty (just <p></p>), set to empty string for validation
 const isEmpty = editor.isEmpty;
 field.handleChange(isEmpty ? "" : html);
 },
 onBlur: () => {
 field.handleBlur();
 },
 });

 // Sync external value changes (e.g. reset)
 React.useEffect(() => {
 if (editor && field.state.value !== editor.getHTML()) {
 // Only update if content is different to avoid cursor jumps
 // But checking HTML equality is tricky.
 // A simple check: if editor is empty and value is not, or vice versa
 if (field.state.value === "" && !editor.isEmpty) {
 editor.commands.clearContent();
 } else if (
 field.state.value &&
 field.state.value !== editor.getHTML() &&
 !editor.isFocused
 ) {
 editor.commands.setContent(field.state.value as string);
 }
 }
 }, [field.state.value, editor]);

 if (!editor) {
 return null;
 }

 const toolbarButtons = config.toolbar ?? [
 "bold",
 "italic",
 "strike",
 "code",
 "separator",
 "heading",
 "list",
 "quote",
 ];

 return (
 <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
 <div
 className={cn(
 "flex flex-col overflow-hidden border border-border/60 bg-background/50 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5",
 showError && "border-destructive/50 ring-4 ring-destructive/5",
 config.disabled && "opacity-60 cursor-not-allowed"
 )}
 >
 {/* Toolbar */}
 {!config.readOnly && !config.disabled && (
 <div className="flex flex-wrap items-center gap-1 border-b border-border/30 bg-muted/20 p-1.5">
 {toolbarButtons.map((btn, i) => {
 if (btn === "separator") {
 return (
 <div
 key={`sep-${i}`}
 className="mx-1 h-5 w-px bg-border/40"
 />
 );
 }

 if (btn === "bold") {
 return (
 <Toggle
 key={btn}
 size="sm"
 pressed={editor.isActive("bold")}
 onPressedChange={() => editor.chain().focus().toggleBold().run()}
 className="size-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
 >
 <Bold className="size-3.5" />
 </Toggle>
 );
 }

 if (btn === "italic") {
 return (
 <Toggle
 key={btn}
 size="sm"
 pressed={editor.isActive("italic")}
 onPressedChange={() => editor.chain().focus().toggleItalic().run()}
 className="size-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
 >
 <Italic className="size-3.5" />
 </Toggle>
 );
 }

 if (btn === "strike") {
 return (
 <Toggle
 key={btn}
 size="sm"
 pressed={editor.isActive("strike")}
 onPressedChange={() => editor.chain().focus().toggleStrike().run()}
 className="size-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
 >
 <Strikethrough className="size-3.5" />
 </Toggle>
 );
 }

 if (btn === "code") {
 return (
 <Toggle
 key={btn}
 size="sm"
 pressed={editor.isActive("code")}
 onPressedChange={() => editor.chain().focus().toggleCode().run()}
 className="size-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
 >
 <Code className="size-3.5" />
 </Toggle>
 );
 }

 if (btn === "heading") {
 return (
 <Toggle
 key={btn}
 size="sm"
 pressed={editor.isActive("heading", { level: 2 })}
 onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
 className="size-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
 >
 <Heading1 className="size-3.5" />
 </Toggle>
 );
 }

 if (btn === "list") {
 return (
 <React.Fragment key={btn}>
 <Toggle
 size="sm"
 pressed={editor.isActive("bulletList")}
 onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
 className="size-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
 >
 <List className="size-3.5" />
 </Toggle>
 <Toggle
 size="sm"
 pressed={editor.isActive("orderedList")}
 onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
 className="size-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
 >
 <ListOrdered className="size-3.5" />
 </Toggle>
 </React.Fragment>
 );
 }

 if (btn === "quote") {
 return (
 <Toggle
 key={btn}
 size="sm"
 pressed={editor.isActive("blockquote")}
 onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
 className="size-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
 >
 <Quote className="size-3.5" />
 </Toggle>
 );
 }

 if (btn === "link") {
 return (
 <Toggle
 key={btn}
 size="sm"
 pressed={editor.isActive("link")}
 onPressedChange={() => {
 const previousUrl = editor.getAttributes('link').href
 const url = window.prompt('URL', previousUrl)
 if (url === null) return // cancelled
 if (url === '') {
 editor.chain().focus().extendMarkRange('link').unsetLink().run()
 return
 }
 editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
 }}
 className="size-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
 >
 <LinkIcon className="size-3.5" />
 </Toggle>
 );
 }

 return null;
 })}
 </div>
 )}

 {/* Editor Area */}
 <EditorContent
 editor={editor}
 className={cn(
 "prose prose-sm prose-stone dark:prose-invert max-w-none p-3 outline-none min-h-[120px]",
 "prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1",
 "[&_.is-editor-empty]:before:text-muted-foreground/50 [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none"
 )}
 style={{
 minHeight: config.minHeight,
 maxHeight: config.maxHeight,
 overflowY: config.maxHeight ? "auto" : undefined
 }}
 />
 </div>
 </FieldWrapper>
 );
};

export default RichTextInput;
