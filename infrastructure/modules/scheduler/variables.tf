variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "scheduler_name" {
  description = "Name for the Cloud Scheduler job"
  type        = string
}

variable "environment" {
  description = "Environment name (production or staging)"
  type        = string
}

variable "cron_schedule" {
  description = "Cron schedule expression"
  type        = string
}

variable "cron_timezone" {
  description = "Timezone for cron schedule"
  type        = string
  default     = "Asia/Tokyo"
}

variable "service_url" {
  description = "URL of the target Cloud Run service"
  type        = string
}

variable "service_name" {
  description = "Name of the target Cloud Run service"
  type        = string
}

variable "cron_secret_id" {
  description = "Secret ID for cron authentication"
  type        = string
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}
