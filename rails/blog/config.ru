# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment', __FILE__)
run Rails.application

# Disabling CORS - Don't use this in production
use Rack::Cors do
  allow do
    origins '*'
    resource '*', :headers => :any, :methods =>  [:get, :post, :put, :delete, :options]
  end
end
