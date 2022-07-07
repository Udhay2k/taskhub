module.exports = {
    apps: [{
      name: "taskhub",
      script: "./index.js",
      env: {
        NODE_ENV: "development"
      },
      env_development: {
        NODE_ENV: "development"
      },
      env_staging: {
        NODE_ENV: "staging"
      },
      env_test: {
        NODE_ENV: "test",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }]
  }