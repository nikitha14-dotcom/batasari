/**
 * Icons for the Work section, exported from the Figma file
 * (Moving Assistant › Page 02 - Work). Geometry is unchanged from the design.
 *
 * Two deliberate adaptations:
 * - ArrowRightIcon strokes with currentColor, so it follows the Visit button
 *   from dark at rest to white on hover (the design has one frame of each).
 * - There is no separate chevron-up: the section rotates ChevronDownIcon 180°
 *   when open, which draws the same shape as the design's chevron-up.
 */
import type { ReactElement } from 'react';
import type { WorkIconName } from '../../lib/work/directory';

function EmploymentServicesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.9998 11.9992H12.0098M16.0001 5.99921V3.99921C16.0001 3.46877 15.7894 2.96007 15.4143 2.58499C15.0392 2.20992 14.5305 1.99921 14 1.99921H9.99966C9.46919 1.99921 8.96044 2.20992 8.58534 2.58499C8.21023 2.96007 7.9995 3.46877 7.9995 3.99921V5.99921M22.0006 12.9992C19.0332 14.9582 15.5557 16.0025 11.9998 16.0025C8.44399 16.0025 4.96647 14.9582 1.99902 12.9992M3.99918 5.99921H20.0005C21.1051 5.99921 22.0006 6.89464 22.0006 7.99921V17.9992C22.0006 19.1038 21.1051 19.9992 20.0005 19.9992H3.99918C2.89453 19.9992 1.99902 19.1038 1.99902 17.9992V7.99921C1.99902 6.89464 2.89453 5.99921 3.99918 5.99921Z"
        stroke="#4C4C4C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function JobPostingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15 15L21 21M10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17Z"
        stroke="#4C4C4C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmployeeRightsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.9258 20.6314C15.0319 19.6781 20 16.7333 20 10.165V6.19691C20 5.07899 20 4.5192 19.7822 4.0918C19.5905 3.71547 19.2837 3.40973 18.9074 3.21799C18.4796 3 17.9203 3 16.8002 3H7.2002C6.08009 3 5.51962 3 5.0918 3.21799C4.71547 3.40973 4.40973 3.71547 4.21799 4.0918C4 4.51962 4 5.08009 4 6.2002V10.165C4 16.7333 8.9678 19.6781 11.074 20.6314C11.2972 20.7325 11.4094 20.7829 11.6621 20.8263C11.8215 20.8537 12.1795 20.8537 12.3389 20.8263C12.5907 20.7831 12.7017 20.7328 12.9235 20.6324L12.9258 20.6314Z"
        stroke="#4C4C4C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.1338 5.5C16.3359 5.50025 16.4998 5.66407 16.5 5.86621V13C16.5 15.3162 14.7499 17.2219 12.5 17.4707V5.5H16.1338Z"
        fill="#4C4C4C"
        stroke="#4C4C4C"
      />
    </svg>
  );
}

function CredentialRecognitionIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.125 11.875V10.075C23.125 8.95489 23.125 8.39484 22.907 7.96702C22.7153 7.59069 22.4093 7.28473 22.033 7.09299C21.6052 6.875 21.0451 6.875 19.925 6.875H8.825C7.70489 6.875 7.14484 6.875 6.71702 7.09299C6.34069 7.28473 6.03473 7.59069 5.84299 7.96702C5.625 8.39484 5.625 8.95489 5.625 10.075V16.175C5.625 17.2951 5.625 17.8552 5.84299 18.283C6.03473 18.6593 6.34069 18.9653 6.71702 19.157C7.14484 19.375 7.7049 19.375 8.825 19.375H16.875"
        stroke="#4C4C4C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M9.375 15.625H14.375" stroke="#4C4C4C" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.375 10.625H18.125" stroke="#4C4C4C" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="21.875" cy="16.875" r="2.525" stroke="#4C4C4C" strokeWidth="1.2" />
      <path
        d="M24.375 23.125C24.375 23.125 23.75 21.875 21.875 21.875C20 21.875 19.375 23.125 19.375 23.125"
        stroke="#4C4C4C"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NetworkingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 19.9999C21 18.2583 19.3304 16.7767 17 16.2275M15 20C15 17.7909 12.3137 16 9 16C5.68629 16 3 17.7909 3 20M15 13C17.2091 13 19 11.2091 19 9C19 6.79086 17.2091 5 15 5M9 13C6.79086 13 5 11.2091 5 9C5 6.79086 6.79086 5 9 5C11.2091 5 13 6.79086 13 9C13 11.2091 11.2091 13 9 13Z"
        stroke="#4C4C4C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResumeInterviewIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 17H15M9 14H15M13.0004 3.00087C12.9048 3 12.7974 3 12.6747 3H8.2002C7.08009 3 6.51962 3 6.0918 3.21799C5.71547 3.40973 5.40973 3.71547 5.21799 4.0918C5 4.51962 5 5.08009 5 6.2002V17.8002C5 18.9203 5 19.4801 5.21799 19.9079C5.40973 20.2842 5.71547 20.5905 6.0918 20.7822C6.51921 21 7.079 21 8.19694 21L15.8031 21C16.921 21 17.48 21 17.9074 20.7822C18.2837 20.5905 18.5905 20.2842 18.7822 19.9079C19 19.4805 19 18.9215 19 17.8036V9.32568C19 9.20302 18.9999 9.09553 18.999 9M13.0004 3.00087C13.2858 3.00348 13.4657 3.01407 13.6382 3.05547C13.8423 3.10446 14.0379 3.18526 14.2168 3.29492C14.4186 3.41857 14.5918 3.59181 14.9375 3.9375L18.063 7.06298C18.4089 7.40889 18.5809 7.58136 18.7046 7.78319C18.8142 7.96214 18.8953 8.15726 18.9443 8.36133C18.9857 8.53379 18.9964 8.71454 18.999 9M13.0004 3.00087L13 5.80021C13 6.92031 13 7.48015 13.218 7.90797C13.4097 8.2843 13.7155 8.59048 14.0918 8.78223C14.5192 9 15.079 9 16.1969 9H18.999"
        stroke="#4C4C4C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SalaryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#work-salary-icon-clip)">
        <path
          d="M12 4.66669V19.3334M15.3333 7.33335H10.3333C9.71449 7.33335 9.121 7.57919 8.68342 8.01677C8.24583 8.45436 8 9.04785 8 9.66669C8 10.2855 8.24583 10.879 8.68342 11.3166C9.121 11.7542 9.71449 12 10.3333 12H13.6667C14.2855 12 14.879 12.2459 15.3166 12.6834C15.7542 13.121 16 13.7145 16 14.3334C16 14.9522 15.7542 15.5457 15.3166 15.9833C14.879 16.4209 14.2855 16.6667 13.6667 16.6667H8"
          stroke="#4C4C4C"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="12" cy="12" r="11.25" stroke="#4C4C4C" strokeWidth="1.5" />
      <defs>
        <clipPath id="work-salary-icon-clip">
          <rect width="16" height="16" fill="white" transform="translate(4 4)" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LightbulbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.75 8.16676C8.86667 7.58338 9.15833 7.17501 9.625 6.70831C10.2083 6.18327 10.5 5.42487 10.5 4.66648C10.5 3.73815 10.1313 2.84784 9.47487 2.19141C8.8185 1.53498 7.92826 1.1662 7 1.1662C6.07174 1.1662 5.1815 1.53498 4.52513 2.19141C3.86875 2.84784 3.5 3.73815 3.5 4.66648C3.5 5.24986 3.61667 5.94992 4.375 6.70831C4.78333 7.11668 5.13333 7.58338 5.25 8.16676M5.25 10.5003H8.75M5.83333 12.8338H8.16667"
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.9165 7.00002H11.0832M6.99984 11.0834L11.0832 7.00002L6.99984 2.91669"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SUBCATEGORY_ICONS: Record<WorkIconName, () => ReactElement> = {
  employmentServices: EmploymentServicesIcon,
  jobPosting: JobPostingIcon,
  employeeRights: EmployeeRightsIcon,
  credentialRecognition: CredentialRecognitionIcon,
  networking: NetworkingIcon,
  resumeInterview: ResumeInterviewIcon,
  salary: SalaryIcon,
};

export function SubcategoryIcon({ name }: { name: WorkIconName }) {
  const Icon = SUBCATEGORY_ICONS[name];
  return <Icon />;
}

