output "job_name" {
  description = "Name of the Cloud Scheduler job"
  value       = google_cloud_scheduler_job.fact_checker_cron.name
}

output "job_schedule" {
  description = "Schedule of the Cloud Scheduler job"
  value       = google_cloud_scheduler_job.fact_checker_cron.schedule
}

output "service_account_email" {
  description = "Email of the scheduler service account"
  value       = google_service_account.scheduler_sa.email
}
