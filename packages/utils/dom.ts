/**
 * DOM helper methods.
 */

import {checkNonNull} from '.';

export interface Point {
  x: number;
  y: number;
}

/**
 * Get the offset of an element relative to the top-left corner of the document.
 * This is helpful for working with mouse event coordinates.
 */
export function getOffset(element: HTMLElement): Point {
  let x = 0,
    y = 0;
  while (element) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent as HTMLElement;
  }
  return {x, y};
}

/**
 * Returns the offset of a mouse event from the top left corner of a DOM element.
 */
export function getRelativeCoordinates(e: MouseEvent, element: HTMLElement): Point {
  const {clientX, clientY} = e;
  const {scrollLeft, scrollTop} = checkNonNull(document.scrollingElement);
  const offset = getOffset(element);
  const x = clientX - offset.x + scrollLeft;
  const y = clientY - offset.y + scrollTop;
  return {x, y};
}
