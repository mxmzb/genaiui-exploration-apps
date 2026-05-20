import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui";
import { openuiPromptOptions } from "@openuidev/react-ui/genui-lib";
import { z } from "zod/v4";
import { createElement } from "react";

const CardGrid = defineComponent({
  name: "CardGrid",
  description:
    "A responsive grid for laying out a list of cards (e.g. apartment listings, search results). " +
    "Adapts to screen size automatically using CSS grid auto-fit. " +
    "Use CardGrid instead of Stack(row, wrap) for any list of similar card-shaped items.",
  props: z.object({
    children: z.array(z.any()),
    minColumnWidth: z
      .number()
      .optional()
      .describe("Minimum card width in pixels before reflowing to fewer columns. Default 280."),
    gap: z
      .number()
      .optional()
      .describe("Gap between cards in pixels. Default 16."),
    maxColumns: z
      .number()
      .optional()
      .describe("Maximum number of columns. Default 3."),
  }),
  component: ({ props, renderNode }) => {
    const minColumnWidth = props.minColumnWidth ?? 280;
    const gap = props.gap ?? 16;
    const maxColumns = props.maxColumns ?? 3;

    const gridTemplateColumns = `repeat(auto-fit, minmax(max(${minColumnWidth}px, calc(100% / ${maxColumns} - ${gap}px)), 1fr))`;

    return createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns,
          gap: `${gap}px`,
          width: "100%",
        },
      },
      renderNode(props.children),
    );
  },
});

const baseComponents = Object.values(openuiLibrary.components);

export const apartmentLibrary = createLibrary({
  root: "Stack",
  componentGroups: [
    ...(openuiLibrary.componentGroups ?? []),
    {
      name: "Custom",
      components: ["CardGrid"],
      notes: [
        "Use CardGrid instead of Stack(row, wrap) for apartment listings and any grid of cards.",
        "CardGrid is responsive by default — cards reflow to fewer columns on smaller screens.",
      ],
    },
  ],
  components: [...baseComponents, CardGrid],
});

export { openuiPromptOptions };
