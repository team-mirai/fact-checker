
output "secret_ids" {
  description = "Map of secret IDs for use in other modules"
  value = {
    openai_api_key       = google_secret_manager_secret.openai_api_key.secret_id
    vector_store_id      = google_secret_manager_secret.vector_store_id.secret_id
    slack_bot_token      = google_secret_manager_secret.slack_bot_token.secret_id
    slack_signing_secret = google_secret_manager_secret.slack_signing_secret.secret_id
    slack_channel_id     = google_secret_manager_secret.slack_channel_id.secret_id
    x_app_key           = google_secret_manager_secret.x_app_key.secret_id
    x_app_secret        = google_secret_manager_secret.x_app_secret.secret_id
    x_access_token      = google_secret_manager_secret.x_access_token.secret_id
    x_access_secret     = google_secret_manager_secret.x_access_secret.secret_id
    cron_secret         = google_secret_manager_secret.cron_secret.secret_id
  }
}

output "secret_names" {
  description = "Map of full secret names for reference"
  value = {
    openai_api_key       = google_secret_manager_secret.openai_api_key.name
    vector_store_id      = google_secret_manager_secret.vector_store_id.name
    slack_bot_token      = google_secret_manager_secret.slack_bot_token.name
    slack_signing_secret = google_secret_manager_secret.slack_signing_secret.name
    slack_channel_id     = google_secret_manager_secret.slack_channel_id.name
    x_app_key           = google_secret_manager_secret.x_app_key.name
    x_app_secret        = google_secret_manager_secret.x_app_secret.name
    x_access_token      = google_secret_manager_secret.x_access_token.name
    x_access_secret     = google_secret_manager_secret.x_access_secret.name
    cron_secret         = google_secret_manager_secret.cron_secret.name
  }
}
