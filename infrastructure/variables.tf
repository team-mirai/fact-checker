
variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "branch_name" {
  description = "Git branch name for environment determination"
  type        = string
  default     = "staging"
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
}

variable "vector_store_id" {
  description = "OpenAI Vector Store ID"
  type        = string
  sensitive   = true
}

variable "slack_bot_token" {
  description = "Slack Bot Token"
  type        = string
  sensitive   = true
}

variable "slack_signing_secret" {
  description = "Slack Signing Secret"
  type        = string
  sensitive   = true
}

variable "slack_channel_id" {
  description = "Slack Channel ID for notifications"
  type        = string
  sensitive   = true
}

variable "x_app_key" {
  description = "X(Twitter) App Key"
  type        = string
  sensitive   = true
}

variable "x_app_secret" {
  description = "X(Twitter) App Secret"
  type        = string
  sensitive   = true
}

variable "x_access_token" {
  description = "X(Twitter) Access Token"
  type        = string
  sensitive   = true
}

variable "x_access_secret" {
  description = "X(Twitter) Access Secret"
  type        = string
  sensitive   = true
}

variable "cron_secret" {
  description = "Secret for cron job authentication"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "asia-northeast1"
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
  
  validation {
    condition     = var.min_instances >= 0 && var.min_instances <= 10
    error_message = "min_instances must be between 0 and 10."
  }
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
  
  validation {
    condition     = var.max_instances >= 1 && var.max_instances <= 100
    error_message = "max_instances must be between 1 and 100."
  }
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run service"
  type        = string
  default     = "1"
  
  validation {
    condition     = contains(["1", "2", "4", "8"], var.cpu_limit)
    error_message = "cpu_limit must be one of: 1, 2, 4, 8."
  }
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run service"
  type        = string
  default     = "512Mi"
  
  validation {
    condition     = can(regex("^[0-9]+(Mi|Gi)$", var.memory_limit))
    error_message = "memory_limit must be in format like '512Mi' or '1Gi'."
  }
}

variable "cron_schedule" {
  description = "Cron schedule expression for fact-checking job"
  type        = string
  default     = "0 12 * * *"
  
  validation {
    condition     = can(regex("^[0-9*,-/]+ [0-9*,-/]+ [0-9*,-/]+ [0-9*,-/]+ [0-9*,-/]+$", var.cron_schedule))
    error_message = "cron_schedule must be a valid cron expression."
  }
}

variable "cron_timezone" {
  description = "Timezone for cron schedule"
  type        = string
  default     = "Asia/Tokyo"
}

variable "enable_public_access" {
  description = "Whether to allow unauthenticated access to Cloud Run service"
  type        = bool
  default     = true
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"
  
  validation {
    condition     = contains(["debug", "info", "warn", "error"], var.log_level)
    error_message = "log_level must be one of: debug, info, warn, error."
  }
}
