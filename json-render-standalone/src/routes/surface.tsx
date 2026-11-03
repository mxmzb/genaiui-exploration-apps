import { createFileRoute } from "@tanstack/react-router";
import SurfaceApp from "../components/SurfaceApp";
export const Route = createFileRoute("/surface")({ component: SurfaceApp });
