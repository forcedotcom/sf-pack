
export type WriteMessageCallback = (message: string) => void;

export class SfUI {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public static writeMessageCallback: WriteMessageCallback = () => {};
}
