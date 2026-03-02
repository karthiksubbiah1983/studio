import type { EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedTextNode, Spread } from 'lexical';

import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import * as React from 'react';
import { Suspense } from 'react';

const VariableComponent = React.lazy(
  // @ts-ignore
  () => import('./VariableComponent'),
);

export type SerializedVariableNode = Spread<
  {
    variableKey: string;
    type: 'variable';
    version: 1;
  },
  SerializedTextNode
>;

export class VariableNode extends DecoratorNode<JSX.Element> {
  __variableKey: string;

  static getType(): string {
    return 'variable';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variableKey, node.__key);
  }

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    const node = $createVariableNode(serializedNode.variableKey);
    return node;
  }
  
  static importDOM(): {
    span: (domNode: HTMLElement) => {
      conversion: (lexicalNode: any) => { node: VariableNode | null };
      priority: 1;
    } | null;
  } {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-variable-key')) {
          return null;
        }
        return {
          conversion: () => {
            const key = domNode.getAttribute('data-variable-key');
            if (key) {
              const node = $createVariableNode(key);
              return { node };
            }
            return { node: null };
          },
          priority: 1, // High priority to ensure this rule matches first
        };
      },
    };
  }

  exportDOM(): {element: HTMLElement} {
    const element = document.createElement('span');
    element.setAttribute('data-variable-key', this.__variableKey);
    element.textContent = this.getTextContent();
    return {element};
  }

  constructor(variableKey: string, key?: NodeKey) {
    super(key);
    this.__variableKey = variableKey;
  }

  exportJSON(): SerializedVariableNode {
    return {
      ...super.exportJSON(),
      variableKey: this.__variableKey,
      type: 'variable',
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    dom.className = 'lexical-variable-node';
    return dom;
  }

  getTextContent(): string {
    return `{${this.__variableKey}}`;
  }
  
  isInline(): boolean {
    return true;
  }

  updateDOM(
    prevNode: unknown,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return React.createElement(
      Suspense,
      { fallback: null },
      React.createElement(VariableComponent, {
        nodeKey: this.__key,
        variableKey: this.__variableKey
      })
    );
  }
}

export function $createVariableNode(
  variableKey: string,
): VariableNode {
  const variableNode = new VariableNode(variableKey);
  return $applyNodeReplacement(variableNode);
}

export function $isVariableNode(
  node: LexicalNode | null | undefined,
): node is VariableNode {
  return node instanceof VariableNode;
}
