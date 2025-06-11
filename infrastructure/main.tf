

provider "google" {
  project = var.gcp_project_id
  region  = var.region
}

module "secrets" {
  source = "./modules/secrets"
  
  environment            = local.environment
  service_account_email  = module.fact_checker_app.service_account_email
  secrets                = var.secrets
}

module "fact_checker_app" {
  source = "./modules/fact-checker-app"
  
  app_name         = local.app_name
  region           = var.region
  container_image  = "${var.region}-docker.pkg.dev/${var.gcp_project_id}/fact-checker-repo/${local.app_name}:latest"
  min_instances    = local.current_config.min_instances
  max_instances    = local.current_config.max_instances
  cpu_limit        = local.current_config.cpu_limit
  memory_limit     = local.current_config.memory_limit
  secret_env_vars  = {
    OPENAI_API_KEY      = module.secrets.secret_versions["openai-api-key"]
    VECTOR_STORE_ID     = module.secrets.secret_versions["vector-store-id"]
    SLACK_BOT_TOKEN     = module.secrets.secret_versions["slack-bot-token"]
    SLACK_SIGNING_SECRET = module.secrets.secret_versions["slack-signing-secret"]
    SLACK_CHANNEL_ID    = module.secrets.secret_versions["slack-channel-id"]
    X_APP_KEY           = module.secrets.secret_versions["x-app-key"]
    X_APP_SECRET        = module.secrets.secret_versions["x-app-secret"]
    X_ACCESS_TOKEN      = module.secrets.secret_versions["x-access-token"]
    X_ACCESS_SECRET     = module.secrets.secret_versions["x-access-secret"]
    X_BEARER_TOKEN      = module.secrets.secret_versions["x-bearer-token"]
    CRON_SECRET         = module.secrets.secret_versions["cron-secret"]
  }
}

module "scheduler" {
  source = "./modules/scheduler"
  
  app_name        = local.app_name
  region          = var.region
  service_url     = module.fact_checker_app.service_url
  service_name    = module.fact_checker_app.service_name
  schedule        = local.current_config.schedule
  cron_secret     = module.secrets.secret_versions["cron-secret"]
}
