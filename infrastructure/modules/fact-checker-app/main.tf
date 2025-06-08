resource "google_artifact_registry_repository" "app_repo" {
  location      = var.region
  repository_id = "${var.app_name}-repo"
  description   = "Container repository for ${var.app_name}"
  format        = "DOCKER"
  
  labels = var.labels
}

resource "google_cloud_run_v2_service" "fact_checker" {
  name     = var.app_name
  location = var.region
  
  labels = var.labels
  
  template {
    labels = var.labels
    
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.repository_id}/app:latest"
      
      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
      }
      
      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.openai_api_key
            version = "latest"
          }
        }
      }
      
      env {
        name = "VECTOR_STORE_ID"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.vector_store_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "SLACK_BOT_TOKEN"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.slack_bot_token
            version = "latest"
          }
        }
      }
      
      env {
        name = "SLACK_SIGNING_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.slack_signing_secret
            version = "latest"
          }
        }
      }
      
      env {
        name = "SLACK_CHANNEL_ID"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.slack_channel_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "X_APP_KEY"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.x_app_key
            version = "latest"
          }
        }
      }
      
      env {
        name = "X_APP_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.x_app_secret
            version = "latest"
          }
        }
      }
      
      env {
        name = "X_ACCESS_TOKEN"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.x_access_token
            version = "latest"
          }
        }
      }
      
      env {
        name = "X_ACCESS_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.x_access_secret
            version = "latest"
          }
        }
      }
      
      env {
        name = "CRON_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids.cron_secret
            version = "latest"
          }
        }
      }
      
      env {
        name  = "NODE_ENV"
        value = var.environment == "production" ? "production" : "development"
      }
      
      env {
        name  = "LOG_LEVEL"
        value = var.log_level
      }
      
      ports {
        container_port = 3000
      }
    }
    
    service_account = google_service_account.cloud_run_sa.email
  }
  
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.app_name}-sa"
  display_name = "Service Account for ${var.app_name}"
  description  = "Service account used by Cloud Run service ${var.app_name}"
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_cloud_run_v2_service_iam_member" "public_access" {
  count = var.enable_public_access ? 1 : 0
  
  name     = google_cloud_run_v2_service.fact_checker.name
  location = google_cloud_run_v2_service.fact_checker.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
