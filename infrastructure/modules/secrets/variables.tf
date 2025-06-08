
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (production or staging)"
  type        = string
}

variable "env_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "labels" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default     = {}
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
  description = "Slack Channel ID"
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
  description = "Cron Secret"
  type        = string
  sensitive   = true
}
