interface AutoMergeCommandOptions {
  assignedToMe: boolean;
  authoredByMe: boolean;
  authoredByDependabot: boolean;
  authoredByRenovate: boolean;
  limit: number;
  user: string;
  repo: string;
  label: string[];
  maxUpdate: number;
  maxUpdatePerRepo: number;
}

export async function performAutoMergeCommand(options: AutoMergeCommandOptions): void {
  console.log(options);
}
