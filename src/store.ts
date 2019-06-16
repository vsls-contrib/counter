export interface ICountStore {
  count: number;
  onChange(handler: () => void): void;
}

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
