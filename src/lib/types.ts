export type ChildProfile = {
  id: string;
  user_id: string;
  child_name: string;
  birth_date: string | null;
  diagnosis: string[] | null;
  current_services: string[] | null;
  location_zip: string | null;
  location_city: string | null;
  location_state: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentType = 'iep' | 'evaluation' | 'therapy_note' | 'other';

export type DocumentRecord = {
  id: string;
  child_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  document_type: DocumentType;
  extracted_text: string | null;
  extracted_data: ExtractedDocumentData | null;
  status: 'processing' | 'complete' | 'failed';
  created_at: string;
};

export type ExtractedDocumentData = {
  summary: string;
  diagnoses: string[];
  current_services: { name: string; provider?: string; frequency?: string }[];
  goals: { area: string; goal: string }[];
  recommendations: string[];
  important_dates: { label: string; date: string }[];
  location?: { zip?: string; city?: string; state?: string };
};

export type RoadmapItemType =
  | 'diagnosis'
  | 'evaluation'
  | 'service_start'
  | 'goal'
  | 'recommendation'
  | 'milestone'
  | 'next_step';

export type RoadmapItem = {
  id: string;
  child_id: string;
  document_id: string | null;
  type: RoadmapItemType;
  title: string;
  description: string | null;
  item_date: string | null;
  is_next_step: boolean;
  status: 'pending' | 'in_progress' | 'done' | null;
  created_at: string;
};

export type CommunityPost = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  topic: CommunityTopic;
  created_at: string;
};

export type CommunityTopic =
  | 'newly_diagnosed'
  | 'iep_help'
  | 'school'
  | 'behavior'
  | 'therapies'
  | 'general';

export type CommunityComment = {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  author_id: string;
  body: string;
  created_at: string;
};

export type Specialist = {
  id: string;
  name: string;
  specialty_type: SpecialtyType;
  practice_name: string | null;
  zip_code: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  insurance_accepted: string[] | null;
  telehealth: boolean;
  notes: string | null;
};

export type SpecialtyType =
  | 'aba'
  | 'speech'
  | 'ot'
  | 'feeding'
  | 'developmental_pediatrician'
  | 'pt'
  | 'psychology'
  | 'neurology'
  | 'other';

export type BenefitCategory =
  | 'medicaid_waiver'
  | 'regional_center'
  | 'ssi'
  | 'able_account'
  | 'state_grant'
  | 'tax_credit'
  | 'respite_care';

export type BenefitProgram = {
  category: BenefitCategory;
  program_name: string;
  covers: string;
  qualifies: string;
  how_to_apply: string;
  wait_time: string | null;
  link: string | null;
};

export type SavedBenefit = {
  id: string;
  user_id: string;
  program_name: string;
  state: string;
  category: BenefitCategory;
  details: BenefitProgram;
  saved_at: string;
};

export type DigestLog = {
  id: string;
  user_id: string;
  sent_at: string;
  status: 'sent' | 'failed';
  error_message: string | null;
};

export type MilestoneAlertStatus = 'active' | 'done' | 'snoozed';

export type MilestoneAlert = {
  id: string;
  user_id: string;
  child_profile_id: string;
  alert_text: string;
  due_date: string | null;
  status: MilestoneAlertStatus;
  snoozed_until: string | null;
  created_at: string;
};
