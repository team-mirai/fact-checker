resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.app_name}-sa"
  display_name = "Service Account for ${var.app_name}"
}

resource "google_cloud_run_v2_service" "fact_checker" {
  name     = var.app_name
  location = var.region
  
  template {
    service_account = google_service_account.cloud_run_sa.email
    
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
    
    containers {
      image = var.container_image
      
      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
      }
      
      env {
        name  = "PORT"
        value = "8080"
      }
      
      dynamic "env" {
        for_each = var.secret_env_vars
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
      
      ports {
        container_port = 8080
      }
      
      startup_probe {
        http_get {
          path = "/"
          port = 8080
        }
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
      }
      
      liveness_probe {
        http_get {
          path = "/"
          port = 8080
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 30
        failure_threshold     = 3
      }
    }
  }
  
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_v2_service.fact_checker.name
  location = google_cloud_run_v2_service.fact_checker.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
