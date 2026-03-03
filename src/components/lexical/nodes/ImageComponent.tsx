
'use client';

import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  NodeKey,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { $isImageNode } from './ImageNode';
import { cn } from '@/lib/utils';
import { Resizable } from 're-resizable';

function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: {
  src: string;
  altText: string;
  width?: 'inherit' | number;
  height?: 'inherit' | number;
  nodeKey: NodeKey;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const ref = useRef<HTMLDivElement>(null);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (event) => {
          const clickedElement = event.target as HTMLElement;
          if (ref.current && ref.current.contains(clickedElement)) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

  const onResize = (event: MouseEvent | TouchEvent, direction: string, ref: HTMLElement, delta: { width: number, height: number }) => {
     const newWidth = parseInt(ref.style.width, 10);
     const newHeight = parseInt(ref.style.height, 10);
     editor.update(() => {
         const node = $getNodeByKey(nodeKey);
         if ($isImageNode(node)) {
            // Not a real lexical-react feature yet
            // node.setWidthAndHeight(newWidth, newHeight);
         }
     });
  };

  return (
    <div ref={ref} className={cn('relative', isSelected && 'outline outline-2 outline-primary')}>
        <Resizable
            defaultSize={{
                width: width === 'inherit' ? '100%' : (width || 500),
                height: height === 'inherit' ? 'auto' : (height || 'auto'),
            }}
            onResizeStop={onResize}
            enable={{
                top: false, right: true, bottom: true, left: false,
                topRight: true, bottomRight: true, bottomLeft: true, topLeft: false
            }}
        >
            <img src={src} alt={altText} className="w-full h-full object-cover" />
        </Resizable>
    </div>
  );
}

export default ImageComponent;
