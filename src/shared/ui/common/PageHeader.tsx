/**
 * @file PageHeader.tsx
 * @description This component displays a page header with a title and an optional description.
 * It is used to provide a consistent look and feel for page titles across the application.
 */

import React from 'react';

/**
 * Props for the PageHeader component.
 */
interface PageHeaderProps {
  /**
   * The main title to be displayed in the page header.
   */
  title: string;
  /**
   * An optional description or subtitle to be displayed below the title.
   */
  description?: string;
}

/**
 * PageHeader component displays a consistent page header with a title and an optional description.
 *
 * @param {PageHeaderProps} { title, description } - The props for the component.
 * @returns {JSX.Element} The rendered page header.
 */
export function PageHeader({ title, description }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
