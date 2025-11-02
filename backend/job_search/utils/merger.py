# file: backend/job_search/utils/merger.py
from typing import List, Dict, Any


def merge_all_results(list_of_job_lists: List[List[Dict[str, Any]]]) -> list[dict]:
    """
    Combine and deduplicate job results from multiple APIs or sources.

    - Deduplicates by (title, company)
    - Returns a single merged list
    - Sorted by recency if 'posted' text (e.g., "3 days ago") is available
    """
    merged: list[dict] = []
    seen: set[tuple[str, str]] = set()

    for sublist in list_of_job_lists or []:
        for job in sublist or []:
            title = str(job.get("title", "")).strip().lower()
            company = str(job.get("company", "")).strip().lower()
            key = (title, company)
            if not title or not company:
                continue  # skip incomplete entries
            if key not in seen:
                seen.add(key)
                merged.append(job)

    def sort_key(job: dict) -> int:
        """
        Attempt to convert human-readable 'posted' field (e.g. '3 days ago')
        into a numeric age (smaller = more recent).
        """
        posted = str(job.get("posted", "")).lower()
        try:
            num = int(posted.split()[0])
        except (ValueError, IndexError):
            return 999

        if "day" in posted:
            return num
        elif "week" in posted:
            return num * 7
        elif "month" in posted:
            return num * 30
        return 999

    # Sort ascending: newer (smaller day count) first
    merged.sort(key=sort_key)
    return merged
