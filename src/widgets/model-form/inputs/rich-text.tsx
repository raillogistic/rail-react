/**
 * Rich text editor input powered by TipTap (ProseMirror).
 *
 * Provides a toolbar with common formatting actions and a WYSIWYG editing
 * area, all wrapped inside the shared FieldWrapper.
 *
 * @module form/inputs/rich-text
 */
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
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type { FieldComponentProps, RichTextFieldConfig } from "./types";
import { useStore } from "@tanstack/react-form";

type Props = FieldComponentProps<RichTextFieldConfig>;

/** Renders a rich text editor with a formatting toolbar. */
const RichTextInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const submitCount = useStore(
    form.store,
    (state) =>
      (state as any).submissionAttempts ?? (state as any).submitCount ?? 0,
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
      const isEmpty = editor.isEmpty;
      field.handleChange(isEmpty ? "" : html);
    },
    onBlur: () => {
      field.handleBlur();
    },
  });

  // Sync external value changes (e.g. form reset)
  React.useEffect(() => {
    if (editor && field.state.value !== editor.getHTML()) {
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

  /** Shared toggle button className for all toolbar items. */
  const toggleClass =
    "size-8 rounded-lg p-0 transition-all duration-200 data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:bg-muted/50 hover:scale-105 active:scale-95";

  return (
    <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border border-input/60 bg-background transition-all duration-300 ease-out",
          "focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 focus-within:shadow-lg focus-within:shadow-primary/[0.02]",
          showError && "border-destructive/40 ring-4 ring-destructive/5",
          config.disabled && "opacity-60 cursor-not-allowed grayscale-[0.5]",
        )}
      >
        {/* ── Toolbar ─────────────────────────────────────────────── */}
        {!config.readOnly && !config.disabled && (
          <div className="flex flex-wrap items-center gap-1 border-b border-border/30 bg-muted/20 backdrop-blur-md px-2 py-2">
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
                    onPressedChange={() =>
                      editor.chain().focus().toggleBold().run()
                    }
                    className={toggleClass}
                  >
                    <Bold className="size-3.5 stroke-[2.5]" />
                  </Toggle>
                );
              }

              if (btn === "italic") {
                return (
                  <Toggle
                    key={btn}
                    size="sm"
                    pressed={editor.isActive("italic")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleItalic().run()
                    }
                    className={toggleClass}
                  >
                    <Italic className="size-3.5 stroke-[2.5]" />
                  </Toggle>
                );
              }

              if (btn === "strike") {
                return (
                  <Toggle
                    key={btn}
                    size="sm"
                    pressed={editor.isActive("strike")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleStrike().run()
                    }
                    className={toggleClass}
                  >
                    <Strikethrough className="size-3.5 stroke-[2.5]" />
                  </Toggle>
                );
              }

              if (btn === "code") {
                return (
                  <Toggle
                    key={btn}
                    size="sm"
                    pressed={editor.isActive("code")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleCode().run()
                    }
                    className={toggleClass}
                  >
                    <Code className="size-3.5 stroke-[2.5]" />
                  </Toggle>
                );
              }

              if (btn === "heading") {
                return (
                  <Toggle
                    key={btn}
                    size="sm"
                    pressed={editor.isActive("heading", { level: 2 })}
                    onPressedChange={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={toggleClass}
                  >
                    <Heading1 className="size-3.5 stroke-[2.5]" />
                  </Toggle>
                );
              }

              if (btn === "list") {
                return (
                  <React.Fragment key={btn}>
                    <Toggle
                      size="sm"
                      pressed={editor.isActive("bulletList")}
                      onPressedChange={() =>
                        editor.chain().focus().toggleBulletList().run()
                      }
                      className={toggleClass}
                    >
                      <List className="size-3.5 stroke-[2.5]" />
                    </Toggle>
                    <Toggle
                      size="sm"
                      pressed={editor.isActive("orderedList")}
                      onPressedChange={() =>
                        editor.chain().focus().toggleOrderedList().run()
                      }
                      className={toggleClass}
                    >
                      <ListOrdered className="size-3.5 stroke-[2.5]" />
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
                    onPressedChange={() =>
                      editor.chain().focus().toggleBlockquote().run()
                    }
                    className={toggleClass}
                  >
                    <Quote className="size-3.5 stroke-[2.5]" />
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
                      const previousUrl = editor.getAttributes("link").href;
                      const url = window.prompt("URL", previousUrl);
                      if (url === null) return;
                      if (url === "") {
                        editor
                          .chain()
                          .focus()
                          .extendMarkRange("link")
                          .unsetLink()
                          .run();
                        return;
                      }
                      editor
                        .chain()
                        .focus()
                        .extendMarkRange("link")
                        .setLink({ href: url })
                        .run();
                    }}
                    className={toggleClass}
                  >
                    <LinkIcon className="size-3.5 stroke-[2.5]" />
                  </Toggle>
                );
              }

              return null;
            })}
          </div>
        )}

        {/* ── Editor area ─────────────────────────────────────────── */}
        <EditorContent
          editor={editor}
          className={cn(
            "prose prose-sm prose-stone dark:prose-invert max-w-none p-5 outline-none min-h-32 transition-all duration-300",
            "prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1",
            "[&_.is-editor-empty]:before:text-muted-foreground/30 [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:font-medium",
          )}
          style={{
            minHeight: config.minHeight,
            maxHeight: config.maxHeight,
            overflowY: config.maxHeight ? "auto" : undefined,
          }}
        />
      </div>
    </FieldWrapper>
  );
};

export default RichTextInput;
