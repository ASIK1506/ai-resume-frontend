// src/services/jobs.ts
import http from "./http";

export type JobRequirements = {
  id?: string;
  title: string;
  description?: string;
  min_years_experience: number;
  required_education: number;
  must_have_skills: string[];
  nice_to_have_skills: string[];
};

export async function listJobs(): Promise<JobRequirements[]> {
  const { data } = await http.get("/api/v1/jobs");
  return data;
}

export async function getJob(jobId: string): Promise<JobRequirements> {
  const { data } = await http.get(`/api/v1/jobs/${jobId}`);
  return data;
}
