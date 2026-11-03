import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
}));

vi.mock("../../lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
  getAccessToken: vi.fn(),
}));

const session = { value: null as unknown };

vi.mock("../../lib/supabase/useSession", () => ({
  useSession: () => ({ session: session.value, loading: false, configured: true }),
}));

import HousingPage from "../housing/page";

describe("housing page access", () => {
  beforeEach(() => {
    routerReplace.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          sections: [
            {
              section_key: "temporary-emergency-accommodation",
              title: "Toronto Shelter System",
              body_markdown:
                "Emergency accommodation and support for people experiencing homelessness; not a rental-booking service. Contact 311 or Central Intake for placement.",
              source: {
                name: "Toronto Shelter System",
                url: "https://www.toronto.ca/community-people/housing-shelter/",
                authority_tier: "A",
                jurisdiction: "Toronto",
              },
            },
            ...[
              ["hostelworld", "Hostelworld", "https://www.hostelworld.com/"],
              ["expedia", "Expedia", "https://www.expedia.ca/"],
              ["booking-com", "Booking.com", "https://www.booking.com/"],
              ["hotels-com", "Hotels.com", "https://ca.hotels.com/"],
              ["trip-com", "Trip.com", "https://www.trip.com/"],
              ["priceline", "Priceline", "https://www.priceline.com/"],
              ["trivago", "Trivago", "https://www.trivago.ca/"],
            ].map(([key, title, url]) => ({
              section_key: `temporary-hotel-${key}`,
              title,
              body_markdown: "",
              source: { name: title, url },
            })),
            {
              section_key: "temporary-airbnb",
              title: "Airbnb",
              body_markdown: "Booked directly with local home hosts.",
              source: {
                name: "Airbnb",
                url: "https://www.airbnb.ca/",
              },
            },
            {
              section_key: "short-term-airbnb-monthly",
              title: "Airbnb Monthly Stays",
              body_markdown:
                "Furnished rooms and entire homes offered for stays of one month or longer; fees, rules, and cancellation terms vary by listing.",
              source: {
                name: "Airbnb Monthly Stays",
                url: "https://www.airbnb.ca/toronto-canada/stays/monthly",
              },
            },
            {
              section_key: "long-term-marketplaces-intro",
              title: "Rental Marketplaces and Directories",
              body_markdown:
                "Listings may be posted directly by landlords or property managers, by licensed agents on the landlord's behalf, or aggregated from other sites. The renter contacts the advertiser and applies directly",
              source: null,
            },
            {
              section_key: "long-term-rentals-ca",
              title: "Rentals.ca",
              body_markdown:
                "owns Rentfaster.ca, Rentboard.ca, RentCanada.com, TorontoRentals.com, Louer.ca.",
              source: { name: "Rentals.ca", url: "https://rentals.ca/" },
            },
            {
              section_key: "agent-listed-intro",
              title: "Agent-Listed Rentals (MLS)",
              body_markdown:
                "Rentals here are listed on MLS by brokerages. Realtor.ca is operated by CREA and represents no one — enquiries go directly to the listing brokerage.",
              source: null,
            },
            ...[
              ["realtor-ca", "Realtor.ca", "https://www.realtor.ca/"],
              ["condos-ca", "Condos.ca", "https://condos.ca/"],
              ["property-ca", "Property.ca", "https://property.ca/"],
            ].map(([key, title, url]) => ({
              section_key: `agent-listed-${key}`,
              title,
              body_markdown: "",
              source: { name: title, url },
            })),
            {
              section_key: "managed-buildings-intro",
              title: "Managed Buildings",
              body_markdown:
                "Rental buildings are operated as rental properties by a company rather than rented by individual condo owners.",
              source: null,
            },
            {
              section_key: "managed-operator-sites-intro",
              title: "Operator sites",
              body_markdown:
                "Large operators list vacancies on their own sites first — the freshest inventory and no third-party middleman.",
              source: null,
            },
            ...[
              ["capreit", "Capreit", "https://www.capreit.ca/"],
              ["bwalk", "Bwalk", "https://www.bwalk.com/"],
              ["realstar", "Realstar", "https://www.realstar.ca/"],
              ["minto", "Minto Apartments", "https://www.minto-apartments.com/"],
              [
                "greenwin",
                "Greenwin",
                "https://www.greenwin.ca/apartments-for-rent/cities/toronto",
              ],
            ].map(([key, title, url]) => ({
              section_key: `managed-${key}`,
              title,
              body_markdown: "",
              source: { name: title, url },
            })),
            {
              section_key: "private-landlords-intro",
              title: "Private landlords",
              body_markdown:
                "Individual owners may rent out condos, houses, basements, or rooms directly.",
              source: null,
            },
            {
              section_key: "rooms-shared-intro",
              title: "Rooms & shared housing",
              body_markdown:
                "**Your rights in shared housing depend heavily on the arrangement.** If you're required to share a kitchen or bathroom with the owner (or certain immediate family members of the owner who live in the building), the Residential Tenancies Act (RTA) generally does not apply. If you're moving into an existing tenant's home without becoming a tenant yourself, you may be an occupant/roommate rather than an RTA tenant.\n\nBefore paying a deposit, confirm who you're renting from, whether the owner lives there, what facilities you share, and whether you'll be named on the lease.",
              source: null,
            },
            {
              section_key: "rooms-shared-owner",
              title: "Room in the owner's home (shared kitchen/bath)",
              body_markdown:
                "Generally not covered by the RTA.",
              source: null,
            },
            ...[
              ["owner-happipad", "Happipad", "https://happipad.com/"],
              ["owner-homeshare", "Canada HomeShare", "https://www.canadahomeshare.com/"],
              ["owner-kijiji", "Kijiji rooms", "https://www.kijiji.ca/"],
              ["roommate-roomies", "Roomies", "https://www.roomies.ca/"],
              [
                "multi-tenant",
                "Multi-tenant house",
                "https://www.toronto.ca/community-people/housing-shelter/rental-housing-rights-information/multi-tenant-rooming-houses/",
              ],
              ["multi-facebook", "Facebook Marketplace/groups", "https://www.facebook.com/marketplace/"],
              ["student", "Student housing", "https://www.places4students.com/"],
            ].map(([key, title, url]) => ({
              section_key: `rooms-shared-${key}`,
              title,
              body_markdown: "",
              source: { name: title, url },
            })),
            {
              section_key: "university-boards",
              title: "University housing boards",
              body_markdown: "",
              source: null,
            },
            ...[
              ["utoronto", "University of Toronto", "https://offcampushousing.utoronto.ca/"],
              ["york", "York University", "https://www.yorku.ca/housing/off-campus/"],
              ["tmu", "Toronto Metropolitan University (TMU)", "https://www.torontooffcampus.ca/"],
              ["george-brown", "George Brown Polytechnic", "https://www.georgebrown.ca/current-students/services/housing"],
              ["humber", "Humber Polytechnic", "https://humber.ca/housing/living-off-campus"],
              ["ocad", "OCAD University", "https://admissions.ocadu.ca/afford/housing-partners"],
            ].map(([key, title, url]) => ({
              section_key: `university-board-${key}`,
              title,
              body_markdown: "",
              source: { name: title, url },
            })),
            {
              section_key: "avoiding-rental-scams",
              title: "Avoiding rental scams",
              body_markdown:
                "Rental scams can appear on any platform. Peer-to-peer sites may provide fewer ways to verify advertisers, while agent-listed and professionally managed rentals are often easier to verify—but no channel is scam-proof.",
              source: null,
            },
          ],
        }),
      })),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  // /housing shipped with no session gate at all, so it was reachable by URL
  // without signing in even while sign-ups were closed to invited accounts.
  it("redirects a signed-out visitor to /login instead of rendering", async () => {
    session.value = null;

    render(<HousingPage />);

    expect(screen.queryByText(/Find Housing/i)).not.toBeInTheDocument();
    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/login"));
  });


});

