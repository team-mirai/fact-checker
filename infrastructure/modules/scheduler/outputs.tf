output "job_name" {
  description = "Cloud Scheduler job name"
  value       = google_cloud_scheduler_job.fact_checker_cron.name
}

output "scheduler_service_account_email" {
  description = "Scheduler service account email"
  value       = google_service_account.scheduler_sa.email
}
