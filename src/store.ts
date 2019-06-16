export interface ICountStore {
  count: number;
  onChange(handler: () => void): void;
}

// This is a very basic store, which allows the extension
// to centralize state management. For example, the custom
// tree provider can subscribe to count changes, without
// needing to worry about the various places the count
// can actually change. Instead of writing your
// own store implementation, you could also use a library
// like Redux, MobX, etc.
class CountStore implements ICountStore {
  private _count = 0;
  private _handler = () => {};

  get count() {
    return this._count;
  }

  set count(count: number) {
    this._count = count;
    this._handler();
  }

  increment() {
    this._count++;
    this._handler();
  }

  onChange(handler: () => void) {
    this._handler = handler;
  }
}

export const store = new CountStore();
