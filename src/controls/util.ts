import {
  TPointerEvent,
  Transform,
  TransformAction,
  BasicTransformEvent,
} from '../EventTypeDefs';
import { resolveOrigin, resolveOriginPoint } from '../util/misc/resolveOrigin';
import { Point } from '../Point';
import type { FabricObject } from '../shapes/Object/FabricObject';
import { TOriginX, TOriginY } from '../typedefs';
import type { Control } from './Control';
import { sendPointToPlane } from '../util/misc/planeChange';
import { calcVectorRotation } from '../util/misc/vectors';
import { PIBy4, twoMathPi } from '../constants';

export const NOT_ALLOWED_CURSOR = 'not-allowed';

/**
 * @param {Boolean} alreadySelected true if target is already selected
 * @param {String} corner a string representing the corner ml, mr, tl ...
 * @param {Event} e Event object
 * @param {FabricObject} [target] inserted back to help overriding. Unused
 */
export const getActionFromCorner = (
  alreadySelected: boolean,
  corner: string,
  e: TPointerEvent,
  target: FabricObject
) => {
  if (!corner || !alreadySelected) {
    return 'drag';
  }
  const control = target.controls[corner];
  return control.getActionName(e, control, target);
};

/**
 * Checks if transform is centered
 * @param {Object} transform transform data
 * @return {Boolean} true if transform is centered
 */
export function isTransformCentered({
  originX,
  originY,
}: {
  originX: TOriginX;
  originY: TOriginY;
}) {
  return resolveOriginPoint(originX, originY).eq(new Point());
}

export function invertOrigin(origin: TOriginX | TOriginY) {
  return -resolveOrigin(origin) + 0.5;
}

export const isLocked = (
  target: FabricObject,
  lockingKey:
    | 'lockMovementX'
    | 'lockMovementY'
    | 'lockRotation'
    | 'lockScalingX'
    | 'lockScalingY'
    | 'lockSkewingX'
    | 'lockSkewingY'
    | 'lockScalingFlip'
) => target[lockingKey];

export const commonEventInfo: TransformAction<
  Transform,
  BasicTransformEvent
> = (eventData, transform, x, y) => {
  return {
    e: eventData,
    transform,
    pointer: new Point(x, y),
  };
};

/**
 * Combine control position and object angle to find the control direction compared
 * to the object center.
 * @param {FabricObject} fabricObject the fabric object for which we are rendering controls
 * @param {Control} control the control class
 * @return {Number} 0 - 7 a quadrant number
 */
export function findCornerQuadrant(
  fabricObject: FabricObject,
  control: Control
) {
  const rotation = calcVectorRotation(
    fabricObject.bbox.vectorFromOrigin(new Point(control))
  );
  return Math.round(((rotation + twoMathPi) % twoMathPi) / PIBy4);
}

/**
 * @returns the normalized point (rotated relative to center) in local coordinates
 */
function normalizePoint(
  target: FabricObject,
  point: Point,
  originX: TOriginX,
  originY: TOriginY
): Point {
  const angle = target.getTotalAngle();
  const p = sendPointToPlane(
    target.getXY(originX, originY),
    undefined,
    target.group?.calcTransformMatrix()
  );
  const p2 = angle
    ? point.rotate(-angle, target.getRelativeCenterPoint())
    : point;
  return p2.subtract(p);
}

/**
 * Transforms a point to the offset from the given origin
 * @param {Object} transform
 * @param {String} originX
 * @param {String} originY
 * @param {number} x
 * @param {number} y
 * @return {Fabric.Point} the normalized point
 */
export function getLocalPoint(
  { target, corner }: Transform,
  originX: TOriginX,
  originY: TOriginY,
  x: number,
  y: number
) {
  const control = target.controls[corner],
    zoom = target.canvas?.getZoom() || 1,
    padding = target.padding / zoom,
    localPoint = normalizePoint(target, new Point(x, y), originX, originY);
  if (localPoint.x >= padding) {
    localPoint.x -= padding;
  }
  if (localPoint.x <= -padding) {
    localPoint.x += padding;
  }
  if (localPoint.y >= padding) {
    localPoint.y -= padding;
  }
  if (localPoint.y <= padding) {
    localPoint.y += padding;
  }
  localPoint.x -= control.offsetX;
  localPoint.y -= control.offsetY;
  return localPoint;
}
