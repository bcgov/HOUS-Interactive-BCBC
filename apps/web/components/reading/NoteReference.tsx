'use client';

import React from 'react';
import './NoteReference.css';

/**
 * NoteReference Component
 * 
 * Renders inline note references that link to note content.
 * Used within clause content to reference notes in the appendix.
 */

interface NoteReferenceProps {
  referenceId: string;
  text: string;
  interactive?: boolean;
  /** 'table-note': a mark of a table note, printed in normal weight as in the PDF. */
  variant?: 'note' | 'table-note';
  /** false: printed full size, e.g. a table-note mark that is the whole cell. */
  superscript?: boolean;
}

export const NoteReference: React.FC<NoteReferenceProps> = ({ 
  referenceId, 
  text, 
  interactive = true,
  variant = 'note',
  superscript = true,
}) => {
  const Tag = superscript ? 'sup' : 'span';
  const classes = [
    'note-reference',
    variant === 'table-note' ? 'note-reference--table-note' : '',
    superscript ? '' : 'note-reference--inline',
  ].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) {
      e.preventDefault();
      return;
    }
    
    // Scroll to the note in the appendix
    const noteElement = document.getElementById(referenceId);
    if (noteElement) {
      noteElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add a temporary highlight effect
      noteElement.classList.add('note-block--highlighted');
      setTimeout(() => {
        noteElement.classList.remove('note-block--highlighted');
      }, 2000);
    }
  };

  if (!interactive) {
    return <Tag className={`${classes} note-reference--non-interactive`}>{text}</Tag>;
  }

  return (
    <Tag className={classes}>
      <a
        href={`#${referenceId}`}
        className="note-reference__link"
        onClick={handleClick}
        aria-label={`Go to note ${text}`}
      >
        {text}
      </a>
    </Tag>
  );
};

