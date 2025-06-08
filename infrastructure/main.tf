


locals {
  environment = var.branch_name == "main" ? "production" : "staging"
  
  env_suffix = local.environment == "production" ? "prod" : "staging"
  app_name   = "x-fact-checker-${local.env_suffix}"
  scheduler_name = "cron-${local.env_suffix}"
  
  environment_config = {
    production = {
      min_instances = 1
      max_instances = 20
      cpu_limit     = "2"
      memory_limit  = "1Gi"
      cron_schedule = "0 9-21 * * *"  # 本番：9-21時毎時実行
      log_level     = "info"
    }
    staging = {
      min_instances = var.min_instances
      max_instances = var.max_instances
      cpu_limit     = var.cpu_limit
      memory_limit  = var.memory_limit
      cron_schedule = var.cron_schedule
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

module "secrets" {
  source = "./modules/secrets"
  
  project_id   = var.gcp_project_id
  environment  = local.environment
  env_suffix   = local.env_suffix
  
  openai_api_key       = var.openai_api_key
  vector_store_id      = var.vector_store_id
  slack_bot_token      = var.slack_bot_token
  slack_signing_secret = var.slack_signing_secret
  slack_channel_id     = var.slack_channel_id
  x_app_key           = var.x_app_key
  x_app_secret        = var.x_app_secret
  x_access_token      = var.x_access_token
  x_access_secret     = var.x_access_secret
  cron_secret         = var.cron_secret
  
  labels = local.common_labels
}

module "fact_checker_app" {
  source = "./modules/fact-checker-app"
  
  project_id = var.gcp_project_id
  region     = var.region
  
  app_name              = local.app_name
  environment           = local.environment
  enable_public_access  = var.enable_public_access
  
  min_instances = local.current_config.min_instances
  max_instances = local.current_config.max_instances
  cpu_limit     = local.current_config.cpu_limit
  memory_limit  = local.current_config.memory_limit
  
  secret_ids = module.secrets.secret_ids
  
  labels = local.common_labels
  
  depends_on = [module.secrets]
}

module "scheduler" {
  source = "./modules/scheduler"
  
  project_id = var.gcp_project_id
  region     = var.region
  
  scheduler_name = local.scheduler_name
  environment    = local.environment
  cron_schedule  = local.current_config.cron_schedule
  cron_timezone  = var.cron_timezone
  
  service_url    = module.fact_checker_app.service_url
  service_name   = module.fact_checker_app.service_name
  cron_secret_id = module.secrets.secret_ids.cron_secret
  
  labels = local.common_labels
  
  depends_on = [module.fact_checker_app, module.secrets]
}
