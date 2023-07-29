export type SelectOption = { label: string; value: string };
export type ArchivableSelectOption = SelectOption & { archived: boolean };
export type ArchivableOptionGroup = { label: string; options: ArchivableSelectOption[] };

/**
 * @see https://stackoverflow.com/a/75638165
 */
export type GuardType<TypeGuardFn> = TypeGuardFn extends (x: any, ...rest: any) => x is infer U
  ? U
  : never;
