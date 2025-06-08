variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "branch_name" {
  description = "Git branch name for environment determination"
  type        = string
  default     = "staging"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "secrets" {
  description = "Map of secret names to create"
  type        = map(string)
  default = {
    "openai-api-key"      = "OpenAI API Key"
    "vector-store-id"     = "Vector Store ID"
    "slack-bot-token"     = "Slack Bot Token"
    "slack-signing-secret" = "Slack Signing Secret"
    "slack-channel-id"    = "Slack Channel ID"
    "x-app-key"           = "X App Key"
    "x-app-secret"        = "X App Secret"
    "x-access-token"      = "X Access Token"
    "x-access-secret"     = "X Access Secret"
    "x-bearer-token"      = "X Bearer Token"
    "cron-secret"         = "Cron Secret"
  }
}

locals {
  environment = var.branch_name == "main" ? "production" : "staging"
  app_name    = var.branch_name == "main" ? "x-fact-checker-prod" : "x-fact-checker-staging"
  
  current_config = local.environment == "production" ? local.prod_config : local.staging_config
  
  prod_config = {
    min_instances = 1
    max_instances = 10
    cpu_limit     = "2"
    memory_limit  = "2Gi"
    schedule      = "0 */6 * * *"
  }
  
  staging_config = {
    min_instances = 0
    max_instances = 3
    cpu_limit     = "1"
    memory_limit  = "1Gi"
    schedule      = "0 */12 * * *"
  }
}
