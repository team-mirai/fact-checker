resource "google_cloud_scheduler_job" "fact_checker_cron" {
  name             = var.scheduler_name
  description      = "Scheduled fact-checking job for ${var.environment} environment"
  schedule         = var.cron_schedule
  time_zone        = var.cron_timezone
  attempt_deadline = "320s"
  
  region = var.region
  
  retry_config {
    retry_count = 3
  }
  
  http_target {
    http_method = "GET"
    uri         = "${var.service_url}/cron/fetch"
    
    headers = {
      "X-Cron-Secret" = var.cron_secret_id
    }
    
    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}

resource "google_service_account" "scheduler_sa" {
  account_id   = "${var.scheduler_name}-sa"
  display_name = "Service Account for ${var.scheduler_name}"
  description  = "Service account used by Cloud Scheduler job ${var.scheduler_name}"
}

resource "google_cloud_run_v2_service_iam_member" "scheduler_invoker" {
  name     = var.service_name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_project_iam_member" "scheduler_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}
