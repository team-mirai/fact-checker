


locals {
  environment = var.branch_name == "main" ? "production" : "staging"
  
  env_suffix = local.environment == "production" ? "prod" : "staging"
  app_name   = "x-fact-checker-${local.env_suffix}"

  
  environment_config = {
    production = {
      min_instances = 1
      max_instances = 20
      cpu_limit     = "2"
      memory_limit  = "1Gi"
      cron_schedule = "0 9-21 * * *"
      log_level     = "info"
    }
    staging = {
      min_instances = var.min_instances
      max_instances = var.max_instances
      cpu_limit     = var.cpu_limit
      memory_limit  = var.memory_limit
      log_level     = var.log_level
    }
  }
  
  current_config = local.environment_config[local.environment]
  
  common_labels = {
    environment = local.environment
    application = "fact-checker"
    managed-by  = "terraform"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.region
}

resource "google_cloud_run_v2_service" "fact_checker" {
  name     = local.app_name
  location = var.region
  
  template {
    labels = local.common_labels
    
    scaling {
      min_instance_count = local.current_config.min_instances
      max_instance_count = local.current_config.max_instances
    }
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.gcp_project_id}/fact-checker-repo/app:latest"
      
      resources {
        limits = {
          cpu    = local.current_config.cpu_limit
          memory = local.current_config.memory_limit
        }
      }
      
      env {
        name  = "NODE_ENV"
        value = local.environment == "production" ? "production" : "development"
      }
      
      env {
        name  = "LOG_LEVEL"
        value = local.current_config.log_level
      }
      
      ports {
        container_port = 3000
      }
    }
  }
  
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
  
  labels = local.common_labels
}
