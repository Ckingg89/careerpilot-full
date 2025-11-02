def merge_all_results(list_of_job_lists):
    """Combine and deduplicate job results from all APIs."""
    merged = []
    seen = set()

    for sublist in list_of_job_lists:
        for job in sublist:
            key = (job.get("title", "").lower(), job.get("company", "").lower())
            if key not in seen:
                seen.add(key)
                merged.append(job)

    # sort by recency if 'posted' is human readable
    def sort_key(job):
        posted = job.get("posted", "")
        if not posted:
            return 999
        if "day" in posted:
            return int(posted.split()[0])
        elif "week" in posted:
            return int(posted.split()[0]) * 7
        elif "month" in posted:
            return int(posted.split()[0]) * 30
        else:
            return 999
    return sorted(merged, key=sort_key)
