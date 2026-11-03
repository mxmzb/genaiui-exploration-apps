import { createFileRoute } from "@tanstack/react-router";
import { ApartmentFinder } from "../components/ApartmentFinder";
import { parseVariant, type Variant } from "../lib/variants";
export const Route = createFileRoute("/")({
  validateSearch: (search): Partial<Variant> => parseVariant(search),
  component: Page,
});
function Page() {
  return <ApartmentFinder initialVariant={parseVariant(Route.useSearch())} />;
}
