import { XMLModule } from "../../../../utils/module";

/**
 * Utility function to asign an xml module for each 4 channel of the controller.
 *
 * @param keepGivenGroup If `true`, it will not change the control's group to "Channel<x>"
 */
export function forEachChannel(
  bind: (channel: number, index: number) => XMLModule | XMLModule[],
  keepGivenGroup = false,
): XMLModule[] {
  const modules: XMLModule[] = [];
  for (let index = 0; index < 4; index++) {
    const binded = [bind(index + 1, index)].flat();
    if (!keepGivenGroup) {
      binded.forEach((_, i) => (binded[i].group = `[Channel${index + 1}]`));
    }

    modules.push(...binded);
  }
  return modules;
}
