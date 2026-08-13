interface AutoReviewOptions {
  assignedToMe: boolean;
  requestedMyReview: boolean;
  authoredByMe: boolean;
  authoredByDependabot: boolean;
  authoredByRenovate: boolean;
  notYetReviewed: boolean;
  notYetReviewedByMe: boolean;
  limit: number;
  user: string;
  repo: string;
  label: string[];
}

export function performAutoReviewCommand(options: AutoReviewOptions): void {
  console.log(options);
}
