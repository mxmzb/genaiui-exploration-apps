import { s } from "@hashbrownai/core";
import { exposeComponent } from "@hashbrownai/react";
import { Markdown } from "#/components/apartment/Markdown";
import { ApartmentCard } from "#/components/apartment/ApartmentCard";
import { ApartmentList } from "#/components/apartment/ApartmentList";
import { DetailView } from "#/components/apartment/DetailView";
import { TourForm } from "#/components/apartment/TourForm";
import { Confirmation } from "#/components/apartment/Confirmation";

export const exposedMarkdown = exposeComponent(Markdown, {
  name: "Markdown",
  description: "Render markdown or plain text to the user",
  props: {
    data: s.streaming.string("The text content to display"),
  },
});

export const exposedApartmentCard = exposeComponent(ApartmentCard, {
  name: "ApartmentCard",
  description: "A summary card for one apartment showing image, title, rent, bedrooms, and sqft",
  props: {
    id: s.string("The apartment ID"),
    title: s.streaming.string("Apartment title"),
    neighborhood: s.string("Neighborhood name"),
    rent: s.number("Monthly rent in dollars"),
    bedrooms: s.string("Bedroom description, e.g. '2 bed' or 'Studio'"),
    sqft: s.number("Square footage"),
    imageUrl: s.string("URL of the apartment image"),
  },
});

export const exposedApartmentList = exposeComponent(ApartmentList, {
  name: "ApartmentList",
  description: "A grid container for apartment cards. Nest ApartmentCard components inside as children.",
  props: {
    title: s.streaming.string("Section heading for the list"),
  },
  children: "any",
});

export const exposedDetailView = exposeComponent(DetailView, {
  name: "DetailView",
  description: "Full details for a single apartment including description, amenities, transit, reviews",
  props: {
    id: s.string("The apartment ID"),
    title: s.streaming.string("Apartment title"),
    neighborhood: s.string("Neighborhood name"),
    rent: s.number("Monthly rent in dollars"),
    bedrooms: s.string("Bedroom description"),
    sqft: s.number("Square footage"),
    imageUrl: s.string("URL of the apartment image"),
    description: s.streaming.string("Full apartment description"),
    amenities: s.array("List of amenity names", s.string("An amenity")),
    nearbyTransit: s.array(
      "Nearby transit options",
      s.object("A transit option", {
        type: s.string("Transit type, e.g. 'subway' or 'bus'"),
        name: s.string("Line or route name"),
        distance: s.string("Walking distance, e.g. '3 min walk'"),
      })
    ),
    petPolicy: s.string("Pet policy description"),
    availableFrom: s.string("Date available, e.g. '2026-06-01'"),
    reviews: s.array(
      "Tenant reviews",
      s.object("A review", {
        author: s.string("Reviewer name"),
        rating: s.number("Rating from 1-5"),
        text: s.string("Review text"),
      })
    ),
  },
});

export const exposedTourForm = exposeComponent(TourForm, {
  name: "TourForm",
  description: "A form for scheduling a tour of an apartment",
  props: {
    apartmentId: s.string("The apartment ID"),
    apartmentTitle: s.string("Apartment title for the form heading"),
  },
});

export const exposedConfirmation = exposeComponent(Confirmation, {
  name: "Confirmation",
  description: "A success confirmation card shown after an action completes",
  props: {
    title: s.streaming.string("Confirmation heading"),
    message: s.streaming.string("Confirmation body text"),
  },
});

export const apartmentComponents = [
  exposedMarkdown,
  exposedApartmentCard,
  exposedApartmentList,
  exposedDetailView,
  exposedTourForm,
  exposedConfirmation,
];
