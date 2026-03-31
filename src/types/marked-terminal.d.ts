declare module 'marked-terminal' {
  import type { MarkedExtension } from 'marked';

  interface MarkedTerminalOptions {
    reflowText?: boolean;
    width?: number;
    tab?: number;
    showSectionPrefix?: boolean;
    code?: (text: string) => string;
    codespan?: (text: string) => string;
    strong?: (text: string) => string;
    em?: (text: string) => string;
    heading?: (text: string) => string;
    listitem?: (text: string) => string;
    link?: (text: string) => string;
    href?: (text: string) => string;
  }

  export function markedTerminal(options?: MarkedTerminalOptions): MarkedExtension;
}
