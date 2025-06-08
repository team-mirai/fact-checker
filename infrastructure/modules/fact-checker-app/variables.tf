variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "app_name" {
  description = "Application name for Cloud Run service"
  type        = string
}

variable "environment" {
  description = "Environment name (production or staging)"
  type        = string
}

variable "enable_public_access" {
  description = "Whether to allow unauthenticated access"
  type        = bool
  default     = true
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "cpu_limit" {
  description = "CPU limit"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit"
  type        = string
  default     = "512Mi"
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"
}

variable "secret_ids" {
  description = "Map of secret IDs from Secret Manager"
  type = object({
    openai_api_key       = string
    vector_store_id      = string
    slack_bot_token      = string
    slack_signing_secret = string
    slack_channel_id     = string
    x_app_key           = string
    x_app_secret        = string
    x_access_token      = string
    x_access_secret     = string
    cron_secret         = string
  })
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}
