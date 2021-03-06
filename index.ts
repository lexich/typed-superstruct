export type TAccessModifiers = undefined | 'r' | '?' | 'r?';
export interface IStack {
  error(key: string, validator: Validator<any, any>): void;
}
export abstract class Validator<T, M extends TAccessModifiers> {
  constructor(public readonly m?: M) {}
  abstract test(t: any, ctx?: IStack): t is T;
}

class TCompose<T1, T2, M extends TAccessModifiers> extends Validator<T1 | T2, M> {
  constructor(public readonly t1: Validator<T1, M>, public readonly t2: Validator<T2, M>, m: M) {
    super(m);
  }

  test(t: any, ctx: IStack): t is T1 & T2 {
    return this.t1.test(t, ctx) || this.t2.test(t, ctx);
  }
}

class TString<M extends TAccessModifiers> extends Validator<string, M> {
  test(t: any): t is string {
    return typeof t === 'string';
  }
}

class TNumber<M extends TAccessModifiers> extends Validator<number, M> {
  test(t: any): t is number {
    return typeof t === 'number';
  }
}

class TBoolean<M extends TAccessModifiers> extends Validator<boolean, M> {
  test(t: any): t is boolean {
    return typeof t === 'boolean';
  }
}

class TNull<M extends TAccessModifiers> extends Validator<null, M> {
  test(t: any): t is null {
    return t === null;
  }
}

class TUndefined<M extends TAccessModifiers> extends Validator<undefined, M> {
  test(t: any): t is undefined {
    return t === undefined;
  }
}

class TObject<
  T extends Record<string, Validator<any, TAccessModifiers>>,
  M extends TAccessModifiers
> extends Validator<T, M> {
  constructor(private t: T, m: M) {
    super(m);
  }

  test(t: any, ctx?: IStack): t is T {
    if (t === null || t === undefined || typeof t !== 'object') {
      return false;
    }
    const keys = Object.keys(this.t);
    for (const k of keys) {
      const prop = this.t[k];
      const v = t[k];
      if (prop.m === '?' || prop.m === 'r?' && v === undefined)  {
        continue;
      }
      if (!prop.test(v, ctx)) {
        ctx?.error(k, prop);
        return false;
      }
    }
    return true;
  }
}

/**
 UnionToIntersection
 Credit: jcalz
 Example:
 // Expect: { name: string } & { age: number } & { visible: boolean }    UnionToIntersection<{ name: string } | { age: number } | { visible: boolean }>
 @desc:
 Get intersection type given union type `U`
 See also:
 https://stackoverflow.com/a/50375286/7381355
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

type Ex<T> = T extends TObject<infer U, TAccessModifiers>
  ? UnionToIntersection<
      {
        [K in keyof U]: U[K] extends Validator<infer A, '?'>
          ? { [K1 in K]?: Ex<U[K1]> }
          : U[K] extends Validator<infer A, 'r'>
          ? { readonly [K1 in K]: Ex<U[K1]> }
          : U[K] extends Validator<infer A, 'r?'>
          ? { readonly [K1 in K]?: Ex<U[K1]> }
          : { [K1 in K]: Ex<U[K1]> };
      }[keyof U]
    >
  : T extends Validator<infer U, any>
  ? U
  : unknown;

const QuickMethods = {
  compose<M extends TAccessModifiers, A1, A2>(
    a1: (m?: M) => Validator<A1, M>,
    a2: (m?: M) => Validator<A2, M>,
    m?: M,
  ): Validator<A1 | A2, M> {
    const t1 = a1(m);
    const t2 = a2(m);
    return new TCompose<A1, A2, M>(t1, t2, m);
  },

  string<M extends TAccessModifiers>(m?: M): TString<M> {
    return new TString<M>(m);
  },

  object<T extends Record<string, Validator<any, TAccessModifiers>>, M extends TAccessModifiers>(
    t: T,
    m?: M,
  ): TObject<T, M> {
    return new TObject<T, M>(t, m);
  },

  number<M extends TAccessModifiers>(m?: M): TNumber<M> {
    return new TNumber<M>(m);
  },
  boolean<M extends TAccessModifiers>(m?: M): TBoolean<M> {
    return new TBoolean<M>(m);
  },
  null<M extends TAccessModifiers>(m?: M): TNull<M> {
    return new TNull<M>(m);
  },
  undefined<M extends TAccessModifiers>(m?: M): TUndefined<M> {
    return new TUndefined<M>(m);
  },
};

export default function create<T extends Validator<any, TAccessModifiers>, TInterface = {}>(
  fn: (t: typeof QuickMethods & TInterface) => T,
  tinterface?: TInterface
) {
  const t = fn({...QuickMethods, ...tinterface});
  type TType = Ex<typeof t>;
  function build(t: TType): TType {
    return t;
  }
  function is(obj: any, ctx?: IStack): obj is TType {
    return t.test(obj, ctx);
  }
  function assert(obj: any, ThrowMessage: ErrorConstructor = Error) {
    let errors: string[];
    const ctx: IStack = {
      error(key: string) {
        if (!errors) {
          errors = [key];
        } else {
          errors.push(key);
        }
      }
    }
    if (!is(obj, ctx)) {
      const path = errors.reverse().join('.')
      throw new ThrowMessage(path);
    }
  };
  return { build, assert, is };
}
