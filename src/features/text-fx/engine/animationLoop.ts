interface LoopOptions {
  loopCount: number;
  cycleDuration: number;
}

export class AnimationLoop {
  private rafId: number | null = null;
  private startTime: number | null = null;

  constructor(
    private readonly render: () => void,
    private readonly getT: () => number,
    private readonly options: LoopOptions = { loopCount: 0, cycleDuration: 2 },
  ) {}

  start(): void {
    this.startTime = null;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (now: number): void => {
    if (this.startTime === null) this.startTime = now;
    const t = this.getT();
    const { loopCount, cycleDuration } = this.options;
    if (loopCount > 0 && t >= loopCount * cycleDuration) {
      this.rafId = null;
      return;
    }
    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  };
}
