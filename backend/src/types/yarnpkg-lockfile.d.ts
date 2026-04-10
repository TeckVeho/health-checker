declare module '@yarnpkg/lockfile' {
  export function parse(input: string): {
    type: string;
    object?: Record<string, { version?: string } & Record<string, unknown>>;
  };
}
