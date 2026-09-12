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
   * ```
   * And then you can mimic it as so in your component's js file :
   * ```js
   * // You have to type "MyDeck" to have the fully typed constructor
   * / ** @ type {typeof MyDeck} * /
   * const MyDeck = componentMaker(function(parent, id) {
   *  // call the "parent" function to mimic the "super" function
   *  parent();
   *  this.id = id;
   *  this.mpfx.debug("It also auto-bind the controller's component");
   * }, components.Deck);
   *
   * const deck = new MyDeck("test");
   * console.log(deck instanceof MyDeck); // true
   * console.log(deck instanceof components.Deck); // true
   * ```
   */
  declare function componentMaker<
    ComponentClass,
    MPFXKey extends string = "mpfx",
    ParentClass extends NewableFunction | undefined = undefined,
    ChildThis = mpfx.Binded<InstanceType<ComponentClass>, MPFXKey>,
    ChildParameters = ConstructorParameters<ComponentClass>,
    SuperFunction = (...args: ConstructorParameters<ParentClass>) => void,
    ChildConstructor extends ParentClass extends undefined
      ? (this: ChildThis, ...args: ChildParameters) => void
      : (
          this: ChildThis,
          parent: SuperFunction,
          ...args: ChildParameters
        ) => void,
  >(
    constructor:
      | ChildConstructor
      | {
          mpfxKey: MPFXKey;
          constructor: ChildConstructor;
        },
    Parent?: ParentClass,
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

  interface trackStateInformations {
    metadata: {
      bpm: number;
      duration: number;
      key: number;
    };
    rate: number;
    rateRange: number;
    elapsed: number;
    position: number;
    key: number;
    key_locked: boolean;
    bpm: number;
  }
}
