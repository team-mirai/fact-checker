
resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "openai-api-key-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "openai_api_key" {
  secret      = google_secret_manager_secret.openai_api_key.id
  secret_data = var.openai_api_key
}

resource "google_secret_manager_secret" "vector_store_id" {
  secret_id = "vector-store-id-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "vector_store_id" {
  secret      = google_secret_manager_secret.vector_store_id.id
  secret_data = var.vector_store_id
}

resource "google_secret_manager_secret" "slack_bot_token" {
  secret_id = "slack-bot-token-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "slack_bot_token" {
  secret      = google_secret_manager_secret.slack_bot_token.id
  secret_data = var.slack_bot_token
}

resource "google_secret_manager_secret" "slack_signing_secret" {
  secret_id = "slack-signing-secret-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "slack_signing_secret" {
  secret      = google_secret_manager_secret.slack_signing_secret.id
  secret_data = var.slack_signing_secret
}

resource "google_secret_manager_secret" "slack_channel_id" {
  secret_id = "slack-channel-id-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "slack_channel_id" {
  secret      = google_secret_manager_secret.slack_channel_id.id
  secret_data = var.slack_channel_id
}

resource "google_secret_manager_secret" "x_app_key" {
  secret_id = "x-app-key-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "x_app_key" {
  secret      = google_secret_manager_secret.x_app_key.id
  secret_data = var.x_app_key
}

resource "google_secret_manager_secret" "x_app_secret" {
  secret_id = "x-app-secret-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "x_app_secret" {
  secret      = google_secret_manager_secret.x_app_secret.id
  secret_data = var.x_app_secret
}

resource "google_secret_manager_secret" "x_access_token" {
  secret_id = "x-access-token-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "x_access_token" {
  secret      = google_secret_manager_secret.x_access_token.id
  secret_data = var.x_access_token
}

resource "google_secret_manager_secret" "x_access_secret" {
  secret_id = "x-access-secret-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "x_access_secret" {
  secret      = google_secret_manager_secret.x_access_secret.id
  secret_data = var.x_access_secret
}

resource "google_secret_manager_secret" "cron_secret" {
  secret_id = "cron-secret-${var.env_suffix}"
  
  labels = var.labels
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "cron_secret" {
  secret      = google_secret_manager_secret.cron_secret.id
  secret_data = var.cron_secret
}
