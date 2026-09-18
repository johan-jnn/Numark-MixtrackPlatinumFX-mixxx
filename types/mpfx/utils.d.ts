namespace mpfx {
  /**
   * Bind the controller's object to the given object in the given key
   */
  type Binded<To, Key = "mpfx"> = To & {
    [key in Key]: typeof MixtrackPlatinumFX;
  };
  /**
   * Utility function to mimic the "extends" class behavior.
   * It returns a custom class which constructor is the first given parameter and
   * extends from the second parameters.
   *
   * ## Usage
   * You have to declare the class in a typescript declaration file :
   * ```ts
   * // components.d.ts
   * class MyDeck extends components.Deck {
   *  constructor(id: string);
   * }
   * class MyChannel extends components.Component {
   *  constructor(id: string);
   *  static MyStaticProps: number;
   * }
   * ```
   * And then you can mimic it as so in your component's js file :
   * ```js
   * // You have to type "MyDeck" to have the fully typed constructor
   * / ** @ type {typeof MyDeck} * /
   * const MyDeck = componentMaker(function(parent, id) {
   *  // call the "parent" function to mimic the "super" function
   *  parent();
   *  // Never use `this.... = ` as it brokes type checks.
   *  Object.assign(this, {id})
   *  this.mpfx.debug("It also auto-bind the controller's component");
   * }, components.Deck);
   *
   * const deck = new MyDeck("test");
   * console.log(deck instanceof MyDeck); // true
   * console.log(deck instanceof components.Deck); // true
   *
   * const MyChannel = componentMaker({
   *  MyStaticProps: 12
   * }, function(parent, id) {
   *  parent();
   *  Object.assign(this, {id})
   * })
   * ```
   */
  declare function componentMaker<
    ComponentClass,
    MPFXKey = "mpfx",
    StaticDefinitions = {
      [key in Exclude<keyof ComponentClass, "prototype">]: ComponentClass[key];
    },
    ParentClass extends NewableFunction | undefined = undefined,
    ChildThis = mpfx.Binded<InstanceType<ComponentClass>, MPFXKey>,
    ChildParameters = ConstructorParameters<ComponentClass>,
    SuperFunction = ((...args: ConstructorParameters<ParentClass>) => void) &
      InstanceType<ParentClass>,
    ChildConstructor extends ParentClass extends undefined
      ? (this: ChildThis, ...args: ChildParameters) => void
      : (
          this: ChildThis,
          parent: SuperFunction,
          ...args: ChildParameters
        ) => void,
    ConstructorArgument extends
      | ChildConstructor
      | {
          mpfxKey: MPFXKey;
          constructor: ChildConstructor;
        },
  >(
    ...args: StaticDefinitions extends Record<any, never>
      ? [constructor: ConstructorArgument, Parent?: ParentClass]
      : [
          static: StaticDefinitions,
          constructor: ConstructorArgument,
          Parent?: ParentClass,
        ]
  ): ComponentClass;

  /**
   * A record where the values are Mixxx's controller input callback functions
   */
  type InputsRecord = Record<string, midi.InputCallback>;
  /**
   * A Mixxx's `ComponentContainer` that contains a record of the given type, keyed by the type's given IdKey key.
   */
  type ContainerOf<Type, IdKey = "id"> = components.ComponentContainer &
    Record<Type[IdKey], Type>;

  type ScreenParts =
    | "bpm"
    | "bpm_arrows"
    | "time"
    | "rate"
    | "rateRange"
    | "keylock";

  interface TrackState {
    /**
     * Rate informations of the track
     */
    rate: {
      /**
       * The current rate of the track
       */
      value: number;
      /**
       * The current defined rate's range
       */
      range: number;
      /**
       * The current rate of the track normalized in [0; 1]
       */
      rate: number;
      /**
       * The current bpm of the track
       */
      bpm: number;
      /**
       * If changeing the rate also affect the track's key
       */
      keyLocked: boolean;
    };
    time: {
      /**
       * The cursor (in seconds) of the elapsed time
       */
      elapsed: number;
      /**
       * The cursor (in seconds) of the remaining time
       */
      remaining: number;
      /**
       * The cursor ([0; 1]) of the elapsed time
       */
      rate: number;
    };
    /**
     * The number representation of the current key of the track
     */
    key: number;
  }

  interface BaseTrack {
    /**
     * The current state of the track (versatile)
     */
    get state(): TrackState;

    /**
     * The track's original bpm
     */
    bpm: number;
    /**
     * The track's total duration
     */
    duration: number;
    /**
     * The number representation of the original key of the track
     */
    keyNum: number;
  }

  type Track = BaseTrack &
    (
      | {
          readonly _hasPlayer: false;
        }
      | ({
          readonly _hasPlayer: true;
        } & Player)
    );
}
