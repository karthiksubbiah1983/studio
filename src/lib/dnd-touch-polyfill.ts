
'use client';

/**
 * Drag-Drop-Touch Polyfill
 * https://github.com/Bernardo-Castilho/drag-drop-touch
 *
 * Copyright (c) 2017, Bernardo Castilho All rights reserved.
 * Copyright (c) 2024, Google LLC All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

if (typeof window !== 'undefined') {
  if (window.navigator.msPointerEnabled) {
    _addMsTouchListeners();
  } else {
    _addTouchListeners();
  }
}
/**
 * Object used to hold the data that is being dragged during drag and drop.
 *
 * It may hold one or more data items of different types. For more information
 * about drag data, see https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer.
 */
export class DataTransfer {
  private _dropEffect = 'move';
  private _effectAllowed = 'all';
  private _data: { [key: string]: any } = {};

  /**
   * Gets or sets the type of drag-and-drop operation. This must be a 'none',
   * 'copy', 'link', or 'move'.
   */
  get dropEffect(): string {
    return this._dropEffect;
  }
  set dropEffect(value: string) {
    this._dropEffect = value;
  }

  /**
   * Gets or sets the type of operations that are possible. This must be one of
   * 'none', 'copy', 'copyLink', 'copyMove', 'link', 'linkMove', 'move',
   * 'all' or 'uninitialized'.
   */
  get effectAllowed(): string {
    return this._effectAllowed;
  }
  set effectAllowed(value: string) {
    this._effectAllowed = value;
  }

  /**
   * Gets an array of strings giving the formats that were set in the
   * 'dragstart' event.
   */
  get types(): string[] {
    return Object.keys(this._data);
  }

  /**
   * Removes the data associated with a given type.
   *
   * The type argument is optional. If the type is not given, the data
   * associated with all types is removed. If data for the given type does not
   * exist, this method will have no effect.
   *
   * @param type Type of data to remove.
   */
  clearData(type?: string): void {
    if (type) {
      delete this._data[type];
    } else {
      this._data = {};
    }
  }

  /**
   * Retrieves the data for a given type, or an empty string if data for that
   * type does not exist or the data transfer contains no data.
   *
   * @param type Type of data to retrieve.
   */
  _getData(type: string): any {
    return this._data[type] || '';
  }

  /**
   * Set the data for a given type.
   *
   * For a list of recommended drag types, please see
   * https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types.
   *
   * @param type Type of data to add.
   * @param value Data to add.
   */
  _setData(type: string, value: any): void {
    this._data[type] = value;
  }

  /**
   * Set the image to be used for dragging.
   *
   * @param img An image element to use for the drag feedback image.
   * @param x The horizontal offset within the image.
   * @param y The vertical offset within the image.
   */
  _setDragImage(img: Element, x: number, y: number): void {
    const ddt = _getDdt();
    ddt._imgCustom = img;
    ddt._imgOffset = { x: x, y: y };
  }
}

//
// PRIVATE
//
let _ddt: Ddt | null = null;
function _getDdt(): Ddt {
  if (!_ddt) {
    _ddt = new Ddt();
  }
  return _ddt;
}

class Ddt {
  _dragSource: HTMLElement | null = null;
  _lastTouch: TouchEvent | null = null;
  _lastTarget: EventTarget | null = null;
  _ptDown: { x: number, y: number } | null = null;
  _isDrag: boolean = false;
  _dataTransfer: DataTransfer = new DataTransfer();
  _img: HTMLElement | null = null;
  _imgCustom: Element | null = null;
  _imgOffset: { x: number, y: number } = { x: 0, y: 0 };
  _deletable = false;

  constructor() {
    this._touchstart = this._touchstart.bind(this);
    this._touchmove = this._touchmove.bind(this);
    this._touchend = this._touchend.bind(this);
    this._onclick = this._onclick.bind(this);
  }

  //
  // event handlers
  //
  _touchstart(e: TouchEvent) {
    if (this._shouldHandle(e)) {
      // clear all variables
      this._reset();

      // get nearest draggable element
      let src = _closestDraggable(e.target as HTMLElement);
      if (src) {
        // give caller a chance to handle the drag better
        if (
          !this._dispatchEvent(
            e,
            'dragstart',
            src,
          )
        ) {
          this._dragSource = src;
          this._ptDown = _getPoint(e);
          this._lastTouch = e;
          // cancel DOCUMENT scrolling
          // e.preventDefault();
          // setTimeout(function() {
          //     if (theDdt._dragSource && theDdt._img) {
          //         theDdt._img.style.display = 'none';
          //     }
          // }, 1)
        }
      }
    }
  }

  _touchmove(e: TouchEvent) {
    if (this._dragSource) {
      // see if target wants to handle move
      let target = this._getTarget(e);
      if (
        target &&
        target !== this._lastTarget &&
        this._lastTarget &&
        this._dispatchEvent(
          e,
          'dragleave',
          this._lastTarget as HTMLElement,
        )
      ) {
        this._lastTarget = null;
      }
      if (target && target !== this._lastTarget) {
        this._lastTarget = target;
        this._dispatchEvent(e, 'dragenter', target);
      }

      // check if we have moved far enough to start dragging
      if (!this._isDrag && this._ptDown) {
        let pt = _getPoint(e);
        if (_distance(this._ptDown, pt) > _THRESHOLD) {
          this._isDrag = true;
          this._createImage(e);
          this._dispatchEvent(e, 'drag', this._dragSource);
        }
      }

      // continue dragging
      if (this._isDrag) {
        this._lastTouch = e;
        e.preventDefault(); // prevent scrolling
        this._dispatchEvent(e, 'dragover', target);
        this._moveImage(e);
      }
    }
  }

  _touchend(e: TouchEvent) {
    if (this._dragSource) {
      if (this._isDrag) {
        // e.preventDefault(); // prevent click
        let target = this._getTarget(e);
        if (target) {
          this._dispatchEvent(e, 'drop', target);
        }
        this._dispatchEvent(e, 'dragend', this._dragSource);
        this._destroyImage();
      }
      this._reset();
    }
  }
  // prevent clicks on the source element
  _onclick(e: Event) {
    if (this._isDrag) {
      e.preventDefault(); // prevent click
    }
  }

  //
  // private methods
  //
  _shouldHandle(e: TouchEvent) {
    return e.touches && e.touches.length < 2;
  }

  _reset() {
    this._dragSource = null;
    this._lastTouch = null;
    this._lastTarget = null;
    this._ptDown = null;
    this._isDrag = false;
    this._dataTransfer = new DataTransfer();
    this._deletable = false;
  }

  _getTarget(e: TouchEvent): HTMLElement | null {
    let pt = _getPoint(e);
    let el = document.elementFromPoint(pt.x, pt.y);
    while (el && getComputedStyle(el).pointerEvents == 'none') {
      el = el.parentElement;
    }
    return el as HTMLElement | null;
  }

  _createImage(e: TouchEvent) {
    //
    // if we have a custom image, use that
    //
    if (this._imgCustom) {
      this._img = this._imgCustom as HTMLElement;
      this._img.style.position = 'absolute';
      this._img.style.left = '0';
      this._img.style.top = '0';
      document.body.appendChild(this._img);
      return;
    }
    //
    // create a clone of the drag source element
    //
    if (this._dragSource) {
      this._img = this._dragSource.cloneNode(true) as HTMLElement;
      _copyStyle(this._dragSource, this._img);
      this._img.style.opacity = '0.5';
      this._img.style.position = 'absolute';
      this._img.style.left = '0';
      this._img.style.top = '0';
      this._img.style.zIndex = '999999';
      this._img.style.pointerEvents = 'none';

      let rc = this._dragSource.getBoundingClientRect();
      this._img.style.width = rc.width + 'px';
      this._img.style.height = rc.height + 'px';

      document.body.appendChild(this._img);
      this._moveImage(e);
    }
  }

  _destroyImage() {
    if (this._img && this._img.parentElement && this._deletable) {
      this._img.parentElement.removeChild(this._img);
    }
    this._img = null;
    this._imgCustom = null;
  }

  _moveImage(e: TouchEvent) {
    if (this._img) {
      requestAnimationFrame(() => {
        let pt = _getPoint(e, true);
        let s = this._img!.style;
        s.left = pt.x - this._imgOffset.x + 'px';
        s.top = pt.y - this._imgOffset.y + 'px';
      });
    }
  }

  _dispatchEvent(
    e: TouchEvent,
    type: string,
    target: EventTarget,
  ): boolean {
    if (e && target) {
      let evt = document.createEvent('Event') as any;
      evt.initEvent(type, true, true);
      evt.button = 0;
      evt.which = evt.buttons = 1;
      let touches =
        type.indexOf('leave') < 0 && type.indexOf('end') < 0 && this._lastTouch
          ? this._lastTouch.touches
          : [];
      let targetTouches =
        type.indexOf('leave') < 0 && type.indexOf('end') < 0 && this._lastTouch
          ? this._lastTouch.targetTouches
          : [];
      let changedTouches = this._lastTouch ? this._lastTouch.changedTouches : [];
      evt.touches = touches;
      evt.targetTouches = targetTouches;
      evt.changedTouches = changedTouches;
      let pt = _getPoint(e);
      evt.screenX = pt.x;
      evt.screenY = pt.y;
      evt.clientX = pt.x;
      evt.clientY = pt.y;
      evt.ctrlKey = e.ctrlKey;
      evt.altKey = e.altKey;
      evt.shiftKey = e.shiftKey;
      evt.metaKey = e.metaKey;
      evt.dataTransfer = this._dataTransfer;
      if (type === 'dragstart') {
        this._deletable = true;
      }
      target.dispatchEvent(evt);
      if (evt.defaultPrevented) {
        if (type === 'dragstart') {
          this._dragSource = null;
        }
        return true; // handled
      }
    }
    return false;
  }
}

//
// start listening to touch events
//
function _addTouchListeners() {
  const ddt = _getDdt();
  document.addEventListener('touchstart', ddt._touchstart, { passive: false });
  document.addEventListener('touchmove', ddt._touchmove, { passive: false });
  document.addEventListener('touchend', ddt._touchend, { passive: false });
  document.addEventListener('touchcancel', ddt._touchend, { passive: false });
  document.addEventListener('click', ddt._onclick, true); // capture phase
}
function _addMsTouchListeners() {
  // sequence of events is:
  // 1. MSPointerDown
  // 2. MSPointerMove
  // 3. MSPointerUp
  const ddt = _getDdt();
  document.addEventListener('MSPointerDown', ddt._touchstart, {
    passive: false,
  });
  document.addEventListener('MSPointerMove', ddt._touchmove, {
    passive: false,
  });
  document.addEventListener('MSPointerUp', ddt._touchend, { passive: false });
  document.addEventListener('MSPointerCancel', ddt._touchend, {
    passive: false,
  });
  document.addEventListener('click', ddt._onclick, true); // capture phase
}
//
// constants
//
const _THRESHOLD = 5; // pixels

//
// utility
//
function _getPoint(e: TouchEvent, page?: boolean): { x: number, y: number } {
  e = e.touches && e.touches.length ? e.touches[0] : e.changedTouches[0];
  let ret = page
    ? { x: e.pageX, y: e.pageY }
    : { x: e.clientX, y: e.clientY };
  return ret;
}

function _distance(
  p1: { x: number, y: number },
  p2: { x: number, y: number }
): number {
  let dx = p2.x - p1.x;
  let dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function _copyStyle(src: HTMLElement, dst: HTMLElement) {
  // remove potentially troublesome attributes
  _rmvAtts.forEach(function (att) {
    dst.removeAttribute(att);
  });

  // copy canvas content
  if (src instanceof HTMLCanvasElement) {
    let cSrc = src;
    let cDst = dst as HTMLCanvasElement;
    cDst.width = cSrc.width;
    cDst.height = cSrc.height;
    cDst.getContext('2d')?.drawImage(cSrc, 0, 0);
  }

  // copy style (without transitions)
  let cs = getComputedStyle(src);
  for (let i = 0; i < cs.length; i++) {
    let key = cs[i];
    if (key.indexOf('transition') < 0) {
      dst.style.setProperty(key, cs.getPropertyValue(key), cs.getPropertyPriority(key));
    }
  }
  dst.style.pointerEvents = 'none';

  // and repeat for all children
  for (let i = 0; i < src.children.length; i++) {
    _copyStyle(src.children[i] as HTMLElement, dst.children[i] as HTMLElement);
  }
}
const _rmvAtts = 'id,class,style,draggable'.split(',');

function _closestDraggable(e: HTMLElement | null): HTMLElement | null {
  for (; e; e = e.parentElement) {
    if (e.hasAttribute('draggable') && e.draggable) {
      return e;
    }
  }
  return null;
}
