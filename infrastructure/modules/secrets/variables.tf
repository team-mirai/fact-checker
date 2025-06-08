variable "environment" {
  description = "Environment name (production or staging)"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for secret access"
  type        = string
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
