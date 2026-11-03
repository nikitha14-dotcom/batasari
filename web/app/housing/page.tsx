"use client";

import { useEffect, useMemo, useState } from "react";

import { Markdown } from "@/components/content/ContentCard";
import {
  ContentError,
  ContentLoading,
  HousingCard,
  HousingShell,
  HousingTypeCards,
  HousingTypeModal,
  ResourceList,
} from "@/components/housing";
import styles from "@/components/housing/housing.module.css";
import {
  HOUSING_SUBCATEGORY,
  type HousingTypeCard,
  SCAMS_INTRO_KEY,
  SCAMS_PREFIX,
  sectionByKey,
  sectionsWithPrefix,
  useHousingContent,
  visibleHousingCards,
} from "@/lib/housing/housingContent";
import { useVisaType } from "@/lib/profile/useVisaType";
import { RequireSession } from "@/lib/supabase/RequireSession";

/**
 * Find Housing (Figma FH-01, popups FH-02 … FH-08).
 *
 * Two accordion cards, both open by default as the frame shows them:
 * "Choose the right type of housing" and "Avoiding Rental Scams".
 *
 * Every resource name, description and link comes from
 * GET /content?category=Housing&subcategory=Find+Housing. The page holds no
 * copy of the seed: the previous version inlined the eight scam resources as
 * a literal array, so a content correction in the database left the page
 * showing the old text with no way to tell.
 */
function FindHousingContent() {
  const { sections, loading, error } = useHousingContent(
    HOUSING_SUBCATEGORY.find,
  );
  const { visaType } = useVisaType();
  // Stable identity: without useMemo this array is new every render, so the
  // card list re-renders on any parent state change.
  const cards = useMemo(() => visibleHousingCards(visaType), [visaType]);
  const [openCard, setOpenCard] = useState<HousingTypeCard | null>(null);

  // The profile arrives after the first paint. If someone opened University
  // housing boards before it landed and the profile turns out not to be a
  // study permit, the card disappears from the grid but the popup would stay
  // open on top of it -- showing gated content after the gate closed.
  useEffect(() => {
    if (openCard && !cards.some((card) => card.id === openCard.id)) {
      setOpenCard(null);
    }
  }, [cards, openCard]);
  const [typesOpen, setTypesOpen] = useState(true);
  const [scamsOpen, setScamsOpen] = useState(true);

  const scamsIntro = sectionByKey(sections, SCAMS_INTRO_KEY);
  const scamResources = sectionsWithPrefix(sections, SCAMS_PREFIX);

  return (
    <HousingShell
      step={1}
      title="Find Housing"
      subcategory={HOUSING_SUBCATEGORY.find}
    >
      {error && <ContentError message={error} />}

      <HousingCard
        icon="🏠"
        title="Choose the right type of housing"
        open={typesOpen}
        onToggle={() => setTypesOpen((o) => !o)}
      >
        <HousingTypeCards
          cards={cards}
          onOpen={setOpenCard}
          disabled={loading || Boolean(error)}
        />
      </HousingCard>

      <HousingCard
        icon="⚠️"
        tone="warn"
        title={scamsIntro?.title ?? "Avoiding Rental Scams"}
        subtitle="Official resources for verifying listings and reporting fraud"
        open={scamsOpen}
        onToggle={() => setScamsOpen((o) => !o)}
      >
        {scamsIntro?.bodyMarkdown && (
          <div className={styles.resourceIntro}>
            <Markdown>{scamsIntro.bodyMarkdown}</Markdown>
          </div>
        )}

        <p className={styles.groupLabel}>Recommended resources</p>

        {loading ? (
          <ContentLoading label="Loading resources…" />
        ) : (
          scamResources.length > 0 && <ResourceList sections={scamResources} />
        )}
      </HousingCard>

      {openCard && (
        <HousingTypeModal
          card={openCard}
          sections={sections}
          onClose={() => setOpenCard(null)}
        />
      )}
    </HousingShell>
  );
}

export default function HousingPage() {
  return (
    <RequireSession>
      <FindHousingContent />
    </RequireSession>
  );
}

