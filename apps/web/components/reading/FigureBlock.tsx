import React from 'react';
import type { Figure } from '@bc-building-code/bcbc-parser';
import { resolveImagePath } from '../../lib/image-config';
import './FigureBlock.css';

type RawFigureGraphic = {
  src?: string;
  alt_text?: string;
};

type FigureWithRawGraphic = Figure & {
  graphic?: RawFigureGraphic;
  number?: string;
  altText?: string;
  imageUrl?: string;
};

export interface FigureBlockProps {
  figure: FigureWithRawGraphic;
}

export const FigureBlock: React.FC<FigureBlockProps> = ({ figure }) => {
  const rawImageSrc = figure.imageUrl || figure.graphic?.src;
  const imagePath = resolveImagePath(rawImageSrc);
  const altText = figure.altText || figure.graphic?.alt_text || figure.title || 'Figure';
  const figureLabel = figure.number ? `Figure ${figure.number}` : 'Figure';

  return (
    <figure className="figure-block">
      <div className="figure-block__title">
        {figureLabel} {figure.title}
      </div>
      {imagePath && (
        <img
          src={imagePath}
          alt={altText}
          className="figure-block__image"
          loading="lazy"
        />
      )}
      {figure.caption && (
        <figcaption className="figure-block__caption">
          {figure.caption}
        </figcaption>
      )}
    </figure>
  );
};
