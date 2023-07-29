// Since the dev server re-requires the bundle, do some shenanigans to make certain things persist
// across that.
//
// Adapted from the Remix Indie Stack

export function singleton<Value>(name: string, valueFactory: () => Value): Value {
  const g = global as any;
  g.__singletons ??= {};
  g.__singletons[name] ??= valueFactory();
  return g.__singletons[name];
}
