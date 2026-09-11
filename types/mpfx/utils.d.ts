namespace mpfx {
  type Binded<To, Key = "mpfx"> = To & {
    [key in Key]: typeof MixtrackPlatinumFX;
  };

  type ComponentMaker<
    Type extends object,
    Extends extends NewableFunction,
    MPFXKey extends string = "mpfx",
    PublicResult = Type & ReturnType<Extends>,
    PrivateResult = Binded<PublicResult, MPFXKey>,
    Constructor extends (this: PrivateResult, ...args: any[]) => void,
  > = (
    constructor: Constructor,
    Parent: Extends,
    ...extenderArgs: Parameters<Extends>
  ) => new (...args: Parameters<Constructor>) => PublicResult;

  type InputsRecord = Record<string, midi.InputCallback>;
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
