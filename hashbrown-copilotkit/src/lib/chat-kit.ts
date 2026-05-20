import { useUiKit } from "@hashbrownai/react";
import { apartmentComponents } from "./components";

export function useHashbrownKit() {
  return useUiKit({
    components: apartmentComponents,
  });
}
