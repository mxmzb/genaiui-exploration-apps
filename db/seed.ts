import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "apartments.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  DROP TABLE IF EXISTS reviews;
  DROP TABLE IF EXISTS apartment_amenities;
  DROP TABLE IF EXISTS apartment_transit;
  DROP TABLE IF EXISTS apartments;

  CREATE TABLE apartments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    rent INTEGER NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms REAL NOT NULL,
    sqft INTEGER NOT NULL,
    address TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    available_from TEXT NOT NULL,
    pet_policy TEXT NOT NULL
  );

  CREATE TABLE apartment_amenities (
    apartment_id TEXT NOT NULL REFERENCES apartments(id),
    amenity TEXT NOT NULL,
    PRIMARY KEY (apartment_id, amenity)
  );

  CREATE TABLE apartment_transit (
    apartment_id TEXT NOT NULL REFERENCES apartments(id),
    transit TEXT NOT NULL,
    PRIMARY KEY (apartment_id, transit)
  );

  CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id TEXT NOT NULL REFERENCES apartments(id),
    author TEXT NOT NULL,
    rating INTEGER NOT NULL,
    text TEXT NOT NULL
  );
`);

const apartments = [
  {
    id: "1",
    title: "Sun-Drenched Loft in Arts District",
    neighborhood: "Arts District",
    rent: 2200,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 850,
    address: "142 Brush St, Unit 4B",
    description:
      "Open-concept loft with 14-foot ceilings, exposed brick, and floor-to-ceiling windows facing south. Original hardwood floors throughout. Building has a shared rooftop deck with city views.",
    image_url:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    available_from: "2026-06-01",
    pet_policy: "Cats only",
    amenities: ["In-unit laundry", "Dishwasher", "Rooftop deck", "Bike storage", "Package lockers"],
    transit: ["Blue Line - 3 min walk", "Bus 16 - 1 min walk"],
    reviews: [
      { author: "Maya T.", rating: 5, text: "Lived here 2 years. The natural light is unreal and the neighborhood keeps getting better." },
      { author: "Jordan K.", rating: 4, text: "Great space and location. Street noise can be loud on weekends but that's the trade-off." },
    ],
  },
  {
    id: "2",
    title: "Modern 2BR with Skyline Views",
    neighborhood: "Midtown",
    rent: 3100,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    address: "89 Park Ave, Unit 12F",
    description:
      "Recently renovated corner unit with panoramic skyline views from the 12th floor. Quartz countertops, stainless appliances, and a balcony off the primary bedroom. Full-service building with 24/7 concierge.",
    image_url:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    available_from: "2026-05-15",
    pet_policy: "Dogs and cats (under 50 lbs)",
    amenities: ["Concierge", "Gym", "Pool", "Balcony", "Central AC", "Parking available ($200/mo)"],
    transit: ["Red Line - 5 min walk", "Express bus - 2 min walk"],
    reviews: [
      { author: "Chris L.", rating: 5, text: "The views alone are worth it. Building management is responsive and the gym is solid." },
      { author: "Priya S.", rating: 4, text: "Beautiful apartment. Concierge is very helpful. Wish parking was included." },
    ],
  },
  {
    id: "3",
    title: "Cozy Studio Near the Park",
    neighborhood: "Riverside",
    rent: 1450,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 480,
    address: "215 River Rd, Unit 2A",
    description:
      "Efficient studio two blocks from Riverside Park. Murphy bed, built-in shelving, and a surprisingly functional galley kitchen. Quiet tree-lined street. Laundry in basement.",
    image_url:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    available_from: "2026-05-01",
    pet_policy: "No pets",
    amenities: ["Murphy bed", "Built-in storage", "Laundry in building", "Heat included"],
    transit: ["Green Line - 7 min walk", "Bus 42 - 4 min walk"],
    reviews: [
      { author: "Alex R.", rating: 4, text: "Perfect for one person. The Murphy bed is a game-changer for the small space. Park access is amazing." },
      { author: "Sam W.", rating: 3, text: "Good value for the area. Kitchen is tight but workable. Wish it allowed pets." },
    ],
  },
  {
    id: "4",
    title: "Spacious 3BR Brownstone Floor-Through",
    neighborhood: "Historic Heights",
    rent: 3800,
    bedrooms: 3,
    bathrooms: 1.5,
    sqft: 1600,
    address: "67 Prospect St, 2nd Floor",
    description:
      "Full floor of a classic brownstone. Original details — crown molding, pocket doors, decorative fireplace — plus a renovated kitchen and updated bath. Private back porch overlooking the garden. Storage in cellar.",
    image_url:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop",
    available_from: "2026-07-01",
    pet_policy: "Pets negotiable",
    amenities: ["Private porch", "Decorative fireplace", "Cellar storage", "Dishwasher", "Garden access"],
    transit: ["Orange Line - 4 min walk", "Bus 9 - 1 min walk"],
    reviews: [
      { author: "Nina D.", rating: 5, text: "This place has so much character. The porch is perfect for morning coffee. Landlord is great." },
      { author: "Marcus J.", rating: 5, text: "Raising a family here. The space is generous and the neighborhood is walkable to everything." },
    ],
  },
  {
    id: "5",
    title: "Luxury Penthouse with Terrace",
    neighborhood: "Financial District",
    rent: 5500,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1350,
    address: "301 Commerce Blvd, PH-2",
    description:
      "Top-floor penthouse with a 400 sqft private terrace. Floor-to-ceiling glass, chef's kitchen with gas range, custom closets. Building features a residents' lounge, co-working space, and cold storage for deliveries.",
    image_url:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    available_from: "2026-06-15",
    pet_policy: "Dogs and cats welcome",
    amenities: ["Private terrace", "Co-working space", "Residents' lounge", "Cold storage", "Valet parking", "EV charging"],
    transit: ["Blue Line - 2 min walk", "Ferry terminal - 8 min walk"],
    reviews: [
      { author: "Elena V.", rating: 5, text: "The terrace is an absolute dream for entertaining. Best apartment I've ever lived in." },
      { author: "David M.", rating: 4, text: "Incredible space and amenities. Rent is steep but you get what you pay for." },
    ],
  },
  {
    id: "6",
    title: "Bright 1BR with Garden Access",
    neighborhood: "Historic Heights",
    rent: 2400,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 720,
    address: "34 Elm St, Unit 1R",
    description:
      "Ground-floor one-bedroom in a restored Victorian with direct access to a shared garden. Original tin ceilings, updated kitchen with butcher-block counters. Quiet block, steps from the farmers' market.",
    image_url:
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop",
    available_from: "2026-06-01",
    pet_policy: "Dogs and cats welcome",
    amenities: ["Garden access", "In-unit laundry", "Dishwasher", "Original tin ceilings"],
    transit: ["Orange Line - 6 min walk", "Bus 9 - 3 min walk"],
    reviews: [
      { author: "Lena F.", rating: 5, text: "The garden is magical in summer. Quiet neighbors and a gorgeous block." },
      { author: "Raj P.", rating: 4, text: "Charming place with real character. Basement laundry would be a dealbreaker for some but I have in-unit." },
    ],
  },
  {
    id: "7",
    title: "Renovated 2BR Corner Unit",
    neighborhood: "Arts District",
    rent: 2850,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    address: "208 Gallery Row, Unit 6A",
    description:
      "Corner two-bedroom with windows on three sides and views of the mural district. Gut-renovated in 2025 with new plumbing, wiring, and mini-split AC. Open kitchen with island seating. Pet-friendly building with a courtyard.",
    image_url:
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=300&fit=crop",
    available_from: "2026-05-20",
    pet_policy: "Dogs and cats (under 40 lbs)",
    amenities: ["Mini-split AC", "Kitchen island", "Courtyard", "Bike room", "Package room"],
    transit: ["Blue Line - 4 min walk", "Bus 16 - 2 min walk"],
    reviews: [
      { author: "Tasha M.", rating: 5, text: "Love the natural light from the corner windows. Renovation is quality — not the cheap-flip kind." },
      { author: "Ian C.", rating: 4, text: "Great layout for roommates. Each bedroom is a real room. Courtyard is a nice bonus." },
    ],
  },
  {
    id: "8",
    title: "Waterfront Studio with Balcony",
    neighborhood: "Riverside",
    rent: 1850,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 520,
    address: "180 Wharf Lane, Unit 5C",
    description:
      "Compact studio with a private balcony overlooking the river. Open layout with a sleeping alcove, full kitchen, and in-unit washer/dryer combo. Building has a kayak launch and waterfront walking path.",
    image_url:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
    available_from: "2026-05-15",
    pet_policy: "Cats only",
    amenities: ["Balcony", "River views", "Washer/dryer combo", "Kayak launch", "Waterfront path"],
    transit: ["Green Line - 5 min walk", "Ferry - 3 min walk"],
    reviews: [
      { author: "Dana K.", rating: 5, text: "Waking up to the river every morning never gets old. The balcony is tiny but perfect for coffee." },
      { author: "Miles R.", rating: 4, text: "Great value for waterfront living. Washer/dryer in unit is a huge plus at this price." },
    ],
  },
  {
    id: "9",
    title: "Industrial 3BR with Rooftop",
    neighborhood: "Arts District",
    rent: 4200,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1400,
    address: "55 Foundry Pl, Unit 3",
    description:
      "Converted warehouse loft spanning the full third floor. Polished concrete floors, steel-beam ceilings, and an oversized freight elevator. Private rooftop access with built-in grill and skyline views. Two full baths, one with a soaking tub.",
    image_url:
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400&h=300&fit=crop",
    available_from: "2026-07-01",
    pet_policy: "Dogs and cats welcome",
    amenities: ["Private rooftop", "Freight elevator", "Soaking tub", "Central AC", "In-unit laundry", "Bike storage"],
    transit: ["Blue Line - 5 min walk", "Bus 16 - 3 min walk"],
    reviews: [
      { author: "Kai W.", rating: 5, text: "The rooftop is incredible for parties. Industrial vibe is authentic, not the fake exposed-brick kind." },
      { author: "Jess L.", rating: 4, text: "Tons of space for the price. Freight elevator is fun but slow. Neighborhood has great food options." },
    ],
  },
];

const insertApartment = db.prepare(`
  INSERT INTO apartments (id, title, neighborhood, rent, bedrooms, bathrooms, sqft, address, description, image_url, available_from, pet_policy)
  VALUES (@id, @title, @neighborhood, @rent, @bedrooms, @bathrooms, @sqft, @address, @description, @image_url, @available_from, @pet_policy)
`);

const insertAmenity = db.prepare(`
  INSERT INTO apartment_amenities (apartment_id, amenity) VALUES (?, ?)
`);

const insertTransit = db.prepare(`
  INSERT INTO apartment_transit (apartment_id, transit) VALUES (?, ?)
`);

const insertReview = db.prepare(`
  INSERT INTO reviews (apartment_id, author, rating, text) VALUES (@apartment_id, @author, @rating, @text)
`);

const seedAll = db.transaction(() => {
  for (const apt of apartments) {
    insertApartment.run({
      id: apt.id,
      title: apt.title,
      neighborhood: apt.neighborhood,
      rent: apt.rent,
      bedrooms: apt.bedrooms,
      bathrooms: apt.bathrooms,
      sqft: apt.sqft,
      address: apt.address,
      description: apt.description,
      image_url: apt.image_url,
      available_from: apt.available_from,
      pet_policy: apt.pet_policy,
    });

    for (const amenity of apt.amenities) {
      insertAmenity.run(apt.id, amenity);
    }

    for (const transit of apt.transit) {
      insertTransit.run(apt.id, transit);
    }

    for (const review of apt.reviews) {
      insertReview.run({
        apartment_id: apt.id,
        author: review.author,
        rating: review.rating,
        text: review.text,
      });
    }
  }
});

seedAll();

console.log(`Seeded ${apartments.length} apartments into ${dbPath}`);

db.close();
