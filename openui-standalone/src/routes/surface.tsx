import { createFileRoute } from "@tanstack/react-router";
import { ApartmentFinder } from "../components/ApartmentFinder";
export const Route = createFileRoute("/surface")({ component: ApartmentFinder });
