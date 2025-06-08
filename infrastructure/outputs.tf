
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
  value       = module.fact_checker_app.service_url
}

output "scheduler_name" {
  description = "Cloud Scheduler job name"
  value       = local.scheduler_name
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
    service_url   = module.fact_checker_app.service_url
    scheduler     = local.scheduler_name
    min_instances = local.current_config.min_instances
    max_instances = local.current_config.max_instances
    cron_schedule = local.current_config.cron_schedule
  }
}
