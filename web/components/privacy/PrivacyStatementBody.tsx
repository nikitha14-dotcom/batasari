"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { safeExternalUrl } from "@/lib/copilot/safeUrl";
import type { SubcategoryContent } from "@/lib/content/contentApi";
import { withKnewSoonerBrand } from "@/lib/content/brandCopy";

import styles from "./privacy-statement-body.module.css";

export function PrivacyMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ href, children: label }) => {
          if (href?.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) {
            return <Link href={href}>{label}</Link>;
          }
          const safeHref = safeExternalUrl(href);
          return safeHref ? (
            <a href={safeHref} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ) : (
            <span>{label}</span>
          );
        },
      }}
    >
      {children.replace(/\[email\]/g, "[contact us](/contact-us)")}
    </ReactMarkdown>
  );
}

function Description({ content }: { content: SubcategoryContent }) {
  const description = content.description;
  if (!description) return null;

  const paragraphs = description.bodyMarkdown.split(/\n\s*\n/);
  const first = paragraphs[0]?.trim() ?? "";
  const date = /^\*\*(Last updated:[^*]+)\*\*$/.exec(first);
  const intro = date ? paragraphs.slice(1).join("\n\n") : description.bodyMarkdown;

  return (
    <>
      <h2 className={styles.articleTitle}>{withKnewSoonerBrand(description.title)}</h2>
      {date && (
        <div className={styles.callout}>
          <strong>{date[1]}</strong>
        </div>
      )}
      {intro && (
        <div className={styles.intro}>
          <PrivacyMarkdown>{withKnewSoonerBrand(intro)}</PrivacyMarkdown>
        </div>
      )}
    </>
  );
}

export function PrivacyStatementBody({ content }: { content: SubcategoryContent }) {
  return (
    <>
      <Description content={content} />
      {content.items.map((section) => (
        <section className={styles.section} id={section.key} key={section.key}>
          <h3>{withKnewSoonerBrand(section.title)}</h3>
          <PrivacyMarkdown>{withKnewSoonerBrand(section.bodyMarkdown)}</PrivacyMarkdown>
        </section>
      ))}
    </>
  );
}

