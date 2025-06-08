output "service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.fact_checker.uri
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.fact_checker.name
}

output "service_account_email" {
  description = "Email of the service account"
  value       = google_service_account.cloud_run_sa.email
}

output "repository_url" {
  description = "URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.repository_id}"
}
