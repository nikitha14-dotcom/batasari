'use client';

import { useCallback, useState } from 'react';
import { WORK_SUBCATEGORIES, type WorkSubcategory } from '../../lib/work/directory';
import { DirectorySection } from './DirectorySection';
import styles from './work.module.css';

type WorkDirectoryProps = {
  /** Defaults to the canonical Work content. Tests can pass a smaller set. */
  subcategories?: WorkSubcategory[];
};

/**
 * The Work centre panel: page heading plus the seven-section directory.
 *
 * All sections load collapsed (spec §4.1). It is an accordion: opening one
 * closes any other (§4.2). Every link in an open section is shown, with no
 * see-more control (§4.4).
 */
export function WorkDirectory({ subcategories = WORK_SUBCATEGORIES }: WorkDirectoryProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.pageTitle}>Work</h1>
        <p className={styles.pageIntro}>
          Resources and guidance to help you find a job, understand your rights, and grow your
          career in Canada.
        </p>
      </div>

      <div className={styles.accordion}>
        {subcategories.map((subcategory) => (
          <DirectorySection
            key={subcategory.id}
            subcategory={subcategory}
            isOpen={openId === subcategory.id}
            onToggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}

