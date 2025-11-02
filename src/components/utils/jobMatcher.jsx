import { base44 } from "@/api/base44Client";

export async function generateMatchingJobs(profile) {
  try {
    // Build search query from profile
    const topSkills = profile.skills?.slice(0, 5).join(' ') || '';
    const latestTitle = profile.experience?.[0]?.title || 'software engineer';
    const searchQuery = `${latestTitle} ${topSkills}`.trim();

    // Step 1: Get real jobs from JSearch API
    const jobSearchResponse = await base44.functions.invoke('searchJobs', {
      query: searchQuery,
      datePosted: profile.job_preferences?.date_posted || 'month',
      remoteJobsOnly: profile.job_preferences?.location_type?.includes('Remote') || false,
      employmentTypes: profile.job_preferences?.job_type?.join(',') || 'FULLTIME',
    });

    if (!jobSearchResponse.data.success || !jobSearchResponse.data.jobs) {
      console.error('Job search failed:', jobSearchResponse.data);
      return [];
    }

    const jobs = jobSearchResponse.data.jobs;

    if (jobs.length === 0) {
      return [];
    }

    // Step 2: Score jobs using AI based on profile
    const scoringResponse = await base44.functions.invoke('scoreJobs', {
      jobs,
      profile: {
        professional_summary: profile.professional_summary,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education
      }
    });

    if (!scoringResponse.data.success || !scoringResponse.data.scoredJobs) {
      console.error('Job scoring failed:', scoringResponse.data);
      // Return unscored jobs as fallback
      return jobs.map(job => ({
        ...job,
        fit_score: 5,
        pay_potential: 5,
        response_rate: 5,
        growth_index: 5
      }));
    }

    // Remove internal _raw data before returning
    return scoringResponse.data.scoredJobs.map(job => {
      const { _raw, ...cleanJob } = job;
      return cleanJob;
    });

  } catch (error) {
    console.error('generateMatchingJobs error:', error);
    return [];
  }
}