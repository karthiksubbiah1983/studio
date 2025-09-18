"use client";

import { createContext, useContext, useReducer, Dispatch, ReactNode } from "react";
import { FormElementInstance, Section, ElementType } from "@/lib/types";
import { createNewElement } from "@/lib/form-elements";

type State = {
  sections: Section[];
  columns: 2 | 3;
  selectedElement: { elementId: string; sectionId: string } | null;
  draggedElement: { element: FormElementInstance; sectionId: string } | { type: ElementType } | null;
};

type Action =
  | { type: "SET_COLUMNS"; payload: 2 | 3 }
  | { type: "ADD_SECTION" }
  | { type: "ADD_ELEMENT"; payload: { sectionId: string; type: ElementType } }
  | { type: "UPDATE_ELEMENT"; payload: { sectionId: string; element: FormElementInstance } }
  | { type: "UPDATE_SECTION"; payload: Section }
  | { type: "SELECT_ELEMENT"; payload: { elementId: string; sectionId: string } | null }
  | { type: "DELETE_ELEMENT"; payload: { elementId: string; sectionId: string } }
  | { type: "DELETE_SECTION"; payload: { sectionId: string } }
  | { type: "SET_DRAGGED_ELEMENT"; payload: State['draggedElement'] }
  | { type: "MOVE_ELEMENT"; payload: { from: { sectionId: string; elementId: string }, to: { sectionId: string; index: number } } };

const initialState: State = {
  sections: [
    {
      id: crypto.randomUUID(),
      title: "Untitled Section",
      config: "expanded",
      elements: [],
    },
  ],
  columns: 2,
  selectedElement: null,
  draggedElement: null,
};

const builderReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_COLUMNS":
      return { ...state, columns: action.payload };
    case "ADD_SECTION":
      return {
        ...state,
        sections: [
          ...state.sections,
          { id: crypto.randomUUID(), title: "New Section", config: "expanded", elements: [] },
        ],
      };
    case "ADD_ELEMENT": {
      const { sectionId, type } = action.payload;
      const newElement = createNewElement(type);
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === sectionId
            ? { ...section, elements: [...section.elements, newElement] }
            : section
        ),
      };
    }
    case "UPDATE_ELEMENT": {
      const { sectionId, element } = action.payload;
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === sectionId
            ? { ...section, elements: section.elements.map(el => el.id === element.id ? element : el) }
            : section
        ),
      };
    }
    case "UPDATE_SECTION":
        return {
            ...state,
            sections: state.sections.map(s => s.id === action.payload.id ? action.payload : s)
        };
    case "SELECT_ELEMENT":
      return { ...state, selectedElement: action.payload };
    case "DELETE_ELEMENT": {
        const { sectionId, elementId } = action.payload;
        return {
            ...state,
            sections: state.sections.map((section) =>
              section.id === sectionId
                ? { ...section, elements: section.elements.filter(el => el.id !== elementId) }
                : section
            ),
            selectedElement: state.selectedElement?.elementId === elementId ? null : state.selectedElement,
        };
    }
    case "DELETE_SECTION": {
        return {
            ...state,
            sections: state.sections.filter(s => s.id !== action.payload.sectionId),
            selectedElement: state.selectedElement?.sectionId === action.payload.sectionId ? null : state.selectedElement,
        };
    }
    case "SET_DRAGGED_ELEMENT":
        return { ...state, draggedElement: action.payload };
    case "MOVE_ELEMENT": {
        const { from, to } = action.payload;
        let elementToMove: FormElementInstance | undefined;

        // Remove element from source
        const sectionsAfterRemoval = state.sections.map(section => {
            if (section.id === from.sectionId) {
                elementToMove = section.elements.find(el => el.id === from.elementId);
                return { ...section, elements: section.elements.filter(el => el.id !== from.elementId) };
            }
            return section;
        });

        if (!elementToMove) return state;

        // Add element to destination
        return {
            ...state,
            sections: sectionsAfterRemoval.map(section => {
                if (section.id === to.sectionId) {
                    const newElements = [...section.elements];
                    newElements.splice(to.index, 0, elementToMove as FormElementInstance);
                    return { ...section, elements: newElements };
                }
                return section;
            })
        };
    }
    default:
      return state;
  }
};

type BuilderContextType = {
  state: State;
  dispatch: Dispatch<Action>;
};

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const BuilderProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  return (
    <BuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
};
