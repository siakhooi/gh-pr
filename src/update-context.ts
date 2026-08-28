export class UpdateContext {
  private updateCount = 0;
  private readonly repoUpdateCountMap: Record<string, number> = {};
  private readonly maxUpdatePerRepo: number;
  private readonly maxUpdate: number;

  constructor(maxUpdatePerRepo: number, maxUpdate: number) {
    this.maxUpdate = maxUpdate;
    this.maxUpdatePerRepo = maxUpdatePerRepo;
  }
  public hasExceedRepoMaxUpdateLimit(repo_url: string): boolean {
    if (this.repoUpdateCountMap[repo_url] >= this.maxUpdatePerRepo) {
      console.log(`SKIP: Reached max update limit of ${this.maxUpdatePerRepo}.`);
      return true;
    }
    return false;
  }
  public updateRepo(repo_url: string): void {
    this.updateCount++;
    this.repoUpdateCountMap[repo_url] = (this.repoUpdateCountMap[repo_url] || 0) + 1;
  }
  public hasExceedMaxUpdateLimit(): boolean {
    if (this.updateCount >= this.maxUpdate) {
      console.log(`STOP: Reached max update limit of ${this.maxUpdate}.`);
      return true;
    }
    return false;
  }
}
