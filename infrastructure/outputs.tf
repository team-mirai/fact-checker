
output "environment" {
  description = "Current environment (production or staging)"
  value       = local.environment
}

output "app_name" {
  description = "Application service name"
  value       = local.app_name
}

output "service_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.fact_checker.uri
}



output "region" {
  description = "GCP region"
  value       = var.region
}

output "resource_summary" {
  description = "Summary of created resources"
  value = {
    environment    = local.environment
    app_name      = local.app_name
    service_url   = google_cloud_run_v2_service.fact_checker.uri
    min_instances = local.current_config.min_instances
    max_instances = local.current_config.max_instances
  }
}
