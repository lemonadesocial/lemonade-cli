export class KillRing {
  private ring: string[] = [];
  private cursor: number = -1;
  private readonly maxSize: number = 32;
  private lastAction: 'kill' | 'yank' | 'other' = 'other';

  push(text: string, append: 'append' | 'prepend' | 'new' = 'new'): void {
    if (text === '') return;

    if (append !== 'new' && this.lastAction === 'kill' && this.ring.length > 0) {
      // Accumulate into the top entry
      const top = this.ring[this.ring.length - 1];
      if (append === 'append') {
        this.ring[this.ring.length - 1] = top + text;
      } else {
        this.ring[this.ring.length - 1] = text + top;
      }
    } else {
      this.ring.push(text);
      if (this.ring.length > this.maxSize) {
        this.ring.shift();
      }
    }
    this.cursor = this.ring.length - 1;
    this.lastAction = 'kill';
  }

  yank(): string | null {
    if (this.ring.length === 0) return null;
    this.cursor = this.ring.length - 1;
    this.lastAction = 'yank';
    return this.ring[this.cursor];
  }

  yankPop(): string | null {
    if (this.ring.length === 0) return null;
    if (this.lastAction !== 'yank') return null;
    this.cursor = this.cursor - 1;
    if (this.cursor < 0) this.cursor = this.ring.length - 1;
    return this.ring[this.cursor];
  }

  setLastAction(action: 'kill' | 'yank' | 'other'): void {
    this.lastAction = action;
  }

  clear(): void {
    this.ring = [];
    this.cursor = -1;
    this.lastAction = 'other';
  }
}
