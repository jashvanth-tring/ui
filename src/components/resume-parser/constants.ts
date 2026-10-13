import type { ProcessingStage } from "./types";

export const PIPELINE_STAGES: { id: ProcessingStage; label: string }[] = [
  { id: "upload", label: "Uploading file" },
  { id: "extract", label: "Extracting text" },
  { id: "parse", label: "Parsing sections" },
  { id: "entities", label: "Extracting entities" },
  { id: "done", label: "Finalizing results" },
];

export const FORM_FIELDS = [
  { key: "candidateName", label: "Full Name", type: "text", placeholder: "e.g. John Smith" },
  { key: "email", label: "Email Address", type: "email", placeholder: "e.g. john@email.com" },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. +91 98765 43210" },
  { key: "location", label: "Location", type: "text", placeholder: "e.g. Chennai, Tamil Nadu" },
  { key: "totalExperience", label: "Total Experience", type: "text", placeholder: "e.g. 2 years 3 months" },
  { key: "relevantExperience", label: "Relevant Experience", type: "text", placeholder: "e.g. 1 year 6 months" },
] as const;

export const EMPTY_FORM = {
  candidateName: "",
  email: "",
  phone: "",
  location: "",
  totalExperience: "",
  relevantExperience: "",
  skillSet: [] as string[],
  remarks: "",
  confidence: {},
  resumeS3Key: "",
};