"use client";

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, $isHeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode, INSERT_TABLE_COMMAND } from "@lexical/table";
import { ListItemNode, ListNode, $isListItemNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode, $isCodeNode, $createCodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { EditorState, $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, UNDO_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, RangeSelection, NodeSelection, GridSelection, $createParagraphNode, $wrapNodes } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import {
  Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered, Undo, Redo, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, ListTodo, Indent, Outdent, Quote, Pilcrow, Type, Heading1, Heading2, Heading3, Heading4, Minus, Table, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode
} from "@lexical/list";
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import { useCallback, useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { Separator } from "@/components/ui/separator";

const theme = {
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "bg-muted p-1 rounded-sm font-mono text-sm",
  },
  heading: {
    h1: "text-4xl font-bold",
    h2: "text-3xl font-bold",
    h3: "text-2xl font-bold",
    h4: "text-xl font-bold",
    h5: "text-lg font-bold",
  },
  list: {
    ol: "list-decimal ml-8",
    ul: "list-disc ml-8",
    listitem: "mb-2",
    nested: {
      listitem: "list-none",
    },
     checklist: "list-none p-0 m-0",
     listitemChecked: "line-through",
     listitemUnchecked: "no-underline",
  },
  link: "text-primary underline",
  quote: "pl-4 border-l-4 border-muted-foreground/50 text-muted-foreground",
  code: 'bg-muted p-2 rounded-sm font-mono text-sm',
  table: 'w-full border-collapse border border-border',
  tableCell: 'border border-border p-2',
  tableCellHeader: 'bg-muted',
};

const editorConfig = {
  namespace: "FormBuilder",
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    HorizontalRuleNode,
  ],
  onError: (error: Error) => {
    console.error(error);
  },
  theme: theme,
};

const blockTypeToBlockName = {
    bullet: 'Bulleted List',
    check: 'Check List',
    code: 'Code Block',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    h6: 'Heading 6',
    number: 'Numbered List',
    paragraph: 'Normal',
    quote: 'Quote',
};

function getSelectedNode(selection: RangeSelection): any {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isSameOrContains(anchorNode, focusNode) ? anchorNode : focusNode;
  } else {
    return $isSameOrContains(focusNode, anchorNode) ? focusNode : anchorNode;
  }
}

function $isSameOrContains(ancestor: any, descendant: any) {
  return ancestor === descendant || ancestor.contains(descendant);
}

const LowPriority = 1;

function BlockFormatDropDown({ editor, blockType }: { editor: any, blockType: keyof typeof blockTypeToBlockName }) {
  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3' | 'h4') => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
  };
  
    const formatCode = () => {
        if (blockType !== 'code') {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    if (selection.isCollapsed()) {
                        $wrapNodes(selection, () => $createCodeNode());
                    } else {
                        const textContent = selection.getTextContent();
                        const codeNode = $createCodeNode();
                        selection.insertNodes([codeNode]);
                        selection.insertRawText(textContent);
                    }
                }
            });
        }
    };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-32 justify-start">
          <span className="truncate">{blockTypeToBlockName[blockType]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={formatParagraph}>Normal</DropdownMenuItem>
        <DropdownMenuItem onClick={() => formatHeading('h1')}>Heading 1</DropdownMenuItem>
        <DropdownMenuItem onClick={() => formatHeading('h2')}>Heading 2</DropdownMenuItem>
        <DropdownMenuItem onClick={() => formatHeading('h3')}>Heading 3</DropdownMenuItem>
        <DropdownMenuItem onClick={formatQuote}>Quote</DropdownMenuItem>
        <DropdownMenuItem onClick={formatCode}>Code Block</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
        const elementKey = element.getKey();
        const elementDOM = editor.getElementByKey(elementKey);
        
        setIsLink($isLinkNode(anchorNode) || $isLinkNode(anchorNode.getParent()));
        
        if (elementDOM !== null) {
            if ($isListNode(element)) {
                const parentList = $getNearestNodeOfType(anchorNode, ListNode);
                const type = parentList ? parentList.getTag() : element.getTag();
                setBlockType(type);
            } else {
                const type = $isHeadingNode(element) ? element.getTag() : element.getType();
                setBlockType(type);
            }
        }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
          updateToolbar();
          return false;
      }, LowPriority)
    );
  }, [updateToolbar, editor]);

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b">
      <Button variant="ghost" size="sm" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>Undo</Button>
      <Button variant="ghost" size="sm" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>Redo</Button>
      <Separator orientation="vertical" className="h-auto"/>
      <BlockFormatDropDown editor={editor} blockType={blockType} />
       <Separator orientation="vertical" className="h-auto"/>
      <Button size="icon" variant="ghost" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}><Bold className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}><Italic className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}><Underline className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}><Strikethrough className="h-4 w-4" /></Button>
      <Separator orientation="vertical" className="h-auto"/>
      <Button variant="ghost" size="icon" onClick={insertLink}><LinkIcon className="h-4 w-4" /></Button>
       <Separator orientation="vertical" className="h-auto"/>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">Align</Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}>Left</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}>Center</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}>Right</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")}>Justify</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
       <Separator orientation="vertical" className="h-auto"/>
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">Insert</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>Bulleted List</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>Numbered List</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}>Check List</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}>Horizontal Rule</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' })}>Table</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}

export function LexicalEditor({ initialValue, onChange }: { initialValue?: string; onChange: (html: string) => void; }) {
  
  const initialConfig = { ...editorConfig, editorState: (editor: any) => {
    if (initialValue) {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialValue, "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);
        $getRoot().select();
        $getRoot().clear();
        $getRoot().append(...nodes);
    }
  }};

  const handleOnChange = (editorState: EditorState, editor: any) => {
    editorState.read(() => {
      const html = $generateHtmlFromNodes(editor, null);
      onChange(html);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="rounded-md border bg-background">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={ <ContentEditable className="p-4 min-h-[150px] focus:outline-none" /> }
            placeholder={ <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">Enter your text...</div> }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleOnChange} />
          <ListPlugin />
          <LinkPlugin />
          <TablePlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}
