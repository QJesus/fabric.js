import type { ObjectEvents } from '../EventTypeDefs';
import { SHARED_ATTRIBUTES } from '../parser/attributes';
import { parseAttributes } from '../parser/parseAttributes';
import { cos } from '../util/misc/cos';
import { degreesToRadians } from '../util/misc/radiansDegreesConversion';
import { sin } from '../util/misc/sin';
import { classRegistry } from '../ClassRegistry';
import { FabricObject, cacheProperties } from './Object/FabricObject';
import type { ChangeContext } from '../util/internals';
import type { TClassProperties } from '../typedefs';
import type {
  FabricObjectProps,
  SerializedObjectProps,
  TProps,
} from './Object/types';

interface UniqueCircleProps {
  /**
   * Radius of this circle
   * @type Number
   * @default 0
   */
  radius: number;

  /**
   * degrees of start of the circle.
   * probably will change to degrees in next major version
   * @type Number 0 - 359
   * @default 0
   */
  startAngle: number;

  /**
   * End angle of the circle
   * probably will change to degrees in next major version
   * @type Number 1 - 360
   * @default 360
   */
  endAngle: number;
}

export interface SerializedCircleProps
  extends SerializedObjectProps,
    UniqueCircleProps {}

export interface CircleProps extends FabricObjectProps, UniqueCircleProps {}

const CIRCLE_PROPS = ['radius', 'startAngle', 'endAngle'] as const;

export const circleDefaultValues: UniqueCircleProps = {
  radius: 0,
  startAngle: 0,
  endAngle: 360,
};

export class Circle<
    Props extends TProps<CircleProps> = Partial<CircleProps>,
    SProps extends SerializedCircleProps = SerializedCircleProps,
    EventSpec extends ObjectEvents = ObjectEvents
  >
  extends FabricObject<Props, SProps, EventSpec>
  implements UniqueCircleProps
{
  declare radius: number;
  declare startAngle: number;
  declare endAngle: number;

  static cacheProperties = [...cacheProperties, ...CIRCLE_PROPS];

  static ownDefaults: Record<string, any> = circleDefaultValues;

  static getDefaults(): Record<string, any> {
    return {
      ...super.getDefaults(),
      ...Circle.ownDefaults,
    };
  }

  protected onChange(context: ChangeContext<this>, target: this): boolean {
    if (context.key === 'radius') {
      this.width = this.height =
        (context as ChangeContext<this, 'radius'>).value * 2;
    }
    return super.onChange(context, target);
  }

  /**
   * @private
   * @param {CanvasRenderingContext2D} ctx context to render on
   */
  _render(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      this.radius,
      degreesToRadians(this.startAngle),
      degreesToRadians(this.endAngle),
      false
    );
    this._renderPaintInOrder(ctx);
  }

  /**
   * Returns horizontal radius of an object (according to how an object is scaled)
   * @return {Number}
   */
  getRadiusX(): number {
    return this.radius * this.scaleX;
  }

  /**
   * Returns vertical radius of an object (according to how an object is scaled)
   * @return {Number}
   */
  getRadiusY(): number {
    return this.radius * this.scaleY;
  }

  /**
   * Sets radius of an object (and updates width accordingly)
   * @deprecated
   */
  setRadius(value: number) {
    this.radius = value;
  }

  /**
   * Returns object representation of an instance
   * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
   * @return {Object} object representation of an instance
   */
  toObject<
    T extends Omit<Props & TClassProperties<this>, keyof SProps>,
    K extends keyof T = never
  >(propertiesToInclude: K[] = []): Pick<T, K> & SProps {
    return super.toObject([...CIRCLE_PROPS, ...propertiesToInclude]);
  }

  /* _TO_SVG_START_ */

  /**
   * Returns svg representation of an instance
   * @return {Array} an array of strings with the specific svg representation
   * of the instance
   */
  _toSVG(): (string | number)[] {
    const angle = (this.endAngle - this.startAngle) % 360;

    if (angle === 0) {
      return [
        '<circle ',
        'COMMON_PARTS',
        'cx="0" cy="0" ',
        'r="',
        this.radius,
        '" />\n',
      ];
    } else {
      const { radius } = this;
      const start = degreesToRadians(this.startAngle),
        end = degreesToRadians(this.endAngle),
        startX = cos(start) * radius,
        startY = sin(start) * radius,
        endX = cos(end) * radius,
        endY = sin(end) * radius,
        largeFlag = angle > 180 ? '1' : '0';
      return [
        `<path d="M ${startX} ${startY}`,
        ` A ${radius} ${radius}`,
        ' 0 ',
        `${largeFlag} 1`,
        ` ${endX} ${endY}`,
        '" ',
        'COMMON_PARTS',
        ' />\n',
      ];
    }
  }
  /* _TO_SVG_END_ */

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link Circle.fromElement})
   * @static
   * @memberOf Circle
   * @see: http://www.w3.org/TR/SVG/shapes.html#CircleElement
   */
  static ATTRIBUTE_NAMES = ['cx', 'cy', 'r', ...SHARED_ATTRIBUTES];

  /**
   * Returns {@link Circle} instance from an SVG element
   * @static
   * @memberOf Circle
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Partial Circle object to default missing properties on the element.
   * @throws {Error} If value of `r` attribute is missing or invalid
   */
  static async fromElement(element: SVGElement): Promise<Circle> {
    const {
      left = 0,
      top = 0,
      radius = 0,
      ...otherParsedAttributes
    } = parseAttributes(element, this.ATTRIBUTE_NAMES) as Partial<CircleProps>;

    // this probably requires to be fixed for default origins not being top/left.

    return new this({
      ...otherParsedAttributes,
      radius,
      left: left - radius,
      top: top - radius,
    });
  }

  /* _FROM_SVG_END_ */

  /**
   * @todo how do we declare this??
   */
  static fromObject<T extends TProps<SerializedCircleProps>>(object: T) {
    return super._fromObject<Circle>(object);
  }
}

classRegistry.setClass(Circle);
classRegistry.setSVGClass(Circle);
