// #region genui - A2UI React renderer: per-message component + persistent hook for surface mode
import { useEffect, useReducer, useRef, useCallback } from "react";
import {
  A2uiSurface,
  basicCatalog,
  MarkdownContext,
  type ReactComponentImplementation,
} from "@a2ui/react/v0_9";
import {
  MessageProcessor,
  type SurfaceModel,
  type A2uiMessage,
} from "@a2ui/web_core/v0_9";
import { renderMarkdown } from "@a2ui/markdown-it";
import "@a2ui/react/styles";

interface A2uiRendererProps {
  messages: A2uiMessage[];
  onAction?: (action: unknown) => void;
}

export function A2uiRenderer({ messages, onAction }: A2uiRendererProps) {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const surfacesRef = useRef(new Map<string, SurfaceModel<ReactComponentImplementation>>());
  const processorRef = useRef<MessageProcessor<ReactComponentImplementation> | null>(null);

  useEffect(() => {
    const processor = new MessageProcessor<ReactComponentImplementation>(
      [basicCatalog],
      (action) => {
        console.log("A2UI user action:", action);
        onAction?.(action);
      }
    );
    processorRef.current = processor;

    processor.onSurfaceCreated((surface) => {
      surfacesRef.current.set(surface.id, surface);
      forceUpdate();
    });

    processor.onSurfaceDeleted((id) => {
      surfacesRef.current.delete(id);
      forceUpdate();
    });

    return () => {
      processorRef.current = null;
      surfacesRef.current = new Map();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!processorRef.current || messages.length === 0) return;
    processorRef.current.processMessages(messages);
    return () => {
      surfacesRef.current = new Map();
    };
  }, [messages]);

  const surfaces = Array.from(surfacesRef.current.values());

  if (surfaces.length === 0) {
    return null;
  }

  return (
    <MarkdownContext.Provider value={renderMarkdown}>
      <div className="a2ui-surfaces space-y-4">
        {surfaces.map((surface) => (
          <A2uiSurface key={surface.id} surface={surface} />
        ))}
      </div>
    </MarkdownContext.Provider>
  );
}

export function useA2uiProcessor(
  onAction?: (action: { name: string; context: Record<string, string> }) => void
) {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const surfacesRef = useRef(new Map<string, SurfaceModel<ReactComponentImplementation>>());
  const processorRef = useRef<MessageProcessor<ReactComponentImplementation> | null>(null);

  useEffect(() => {
    const processor = new MessageProcessor<ReactComponentImplementation>(
      [basicCatalog],
      (action) => {
        onAction?.(action as { name: string; context: Record<string, string> });
      }
    );
    processorRef.current = processor;

    processor.onSurfaceCreated((surface) => {
      surfacesRef.current.set(surface.id, surface);
      forceUpdate();
    });

    processor.onSurfaceDeleted((id) => {
      surfacesRef.current.delete(id);
      forceUpdate();
    });

    return () => {
      processorRef.current = null;
      surfacesRef.current = new Map();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const processMessages = useCallback((messages: A2uiMessage[]) => {
    processorRef.current?.processMessages(messages);
  }, []);

  return {
    surfaces: Array.from(surfacesRef.current.values()),
    processMessages,
  };
}

export function SurfaceRenderer({ surfaces }: { surfaces: SurfaceModel<ReactComponentImplementation>[] }) {
  if (surfaces.length === 0) return null;

  console.log("Rendering surfaces:", surfaces.length, surfaces.map(s => s.id));

  return (
    <MarkdownContext.Provider value={renderMarkdown}>
      <div className="a2ui-surfaces space-y-4">
        {surfaces.map((surface) => (
          <A2uiSurface key={surface.id} surface={surface} />
        ))}
      </div>
    </MarkdownContext.Provider>
  );
}
// #endregion genui

export default A2uiRenderer;
