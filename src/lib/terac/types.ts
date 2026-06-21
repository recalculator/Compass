export type QualifyLogic = 'may' | 'must' | 'must_one_of' | 'reject';

export type ScreeningQuestion = {
  key: string;
  text: string;
  pick: 'one' | 'any' | 'boolean' | 'text';
  answers?: { text: string; qualify_logic: QualifyLogic }[];
  allow_paste?: boolean;
};

export type OpportunityFilter = Record<string, Record<string, string | number | string[]>>;

export type OpportunityTask = {
  sequence: number;
  task_type: 'interview' | 'file_upload' | 'activity';
  review_type: 'auto_approve' | 'manual_review' | 'self_report';
  task_url: string;
  duration_minutes: number;
  title?: string;
  description?: string;
};

export type CreateOpportunityParams = {
  title: string;
  internal_title?: string;
  description?: string;
  project_id: string;
  num_participants: number;
  business_type: 'b2c' | 'b2b';
  tasks: OpportunityTask[];
  filters?: OpportunityFilter[];
  screening_questions?: ScreeningQuestion[];
  expected_days_to_complete?: number;
};

export type OpportunityStatus = 'draft' | 'active' | 'fulfilled' | 'paused' | 'stopped' | 'completed';

export type Opportunity = {
  id: string;
  title: string;
  status: OpportunityStatus;
  num_participants: number;
};

export type SubmissionStatus = 'in_progress' | 'awaiting_review' | 'approved' | 'rejected';

export type Submission = {
  id: string;
  opportunity_id: string;
  status: SubmissionStatus;
  participant_id: string;
  created_at: string;
  updated_at: string;
};

export type SubmissionDetail = Submission & {
  screening_answers: { key: string; question: string; answer: string[] }[];
  tasks: { sequence: number; task_type: string; status: string }[];
};

export type ListSubmissionsResponse = {
  data: Submission[];
  pagination: { next_cursor: string | null; has_more: boolean };
};
